import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseService } from '../../@common/response';
import { CreateInvoiceDTO, GetInvoicesDTO } from '../dtos/invoice.dto';
import { UUID } from 'crypto';
import { BusinessRepository } from '../../repositories/business.repository';
import {
  ErrorMessage,
  SuccessMessage,
} from '../../@common/constants/message.constant';
import { DbTransactionManager } from '../../@common/database/database-transaction.manager';
import { InvoiceRepository } from '../../repositories/invoice.repository';
import { InvoiceItemRepository } from '../../repositories/invoice-item.repository';
import { InvoiceUserRepository } from '../../repositories/invoice-user.repository';
import { CouponRepository } from '../../repositories/coupon.repository';
import { Invoice, InvoiceStatus } from '../../entities/invoice.entity';
import { ProductRepository } from '../../repositories/product.repository';
import { InvoiceSanitizer } from '../sanitizers/invoice.sanitizer';
import { SelectQueryBuilder } from 'typeorm';
import { Util } from '../../@common/utilities/helpers.utility';
import { QueryUtil } from '../../@common/utilities/query.utility';
import { isUUID } from 'class-validator';
import { DiscountType } from '../../entities/coupon.entity';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly businessRepository: BusinessRepository,
    private readonly dbTransactionManger: DbTransactionManager,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly invoiceUserRepository: InvoiceUserRepository,
    private readonly invoiceItemRepository: InvoiceItemRepository,
    private readonly couponRepository: CouponRepository,
    private readonly productRepository: ProductRepository,
    private readonly invoiceSanitizer: InvoiceSanitizer,
  ) {}

  async createInvoice(payload: CreateInvoiceDTO, businessOwnerId: UUID) {
    const {
      businessId,
      userId,
      currency,
      issuedAt = new Date(),
      dueDate,
      paymentMethod,
      discountType,
      note,
      items,
    } = payload;

    let { discountValue } = payload;

    discountValue =
      discountType === DiscountType.PERCENTAGE
        ? discountValue
        : Util.toKobo(discountValue);

    const business = await this.businessRepository.exists({
      where: { id: businessId, user: businessOwnerId },
    });

    if (!business)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Business'),
        null,
        HttpStatus.NOT_FOUND,
      );

    const response = await this.dbTransactionManger.transaction(
      async (manager) => {
        const entityManager = manager.entityManager;

        let subtotal = 0;
        let totalDiscountAmount = 0;

        const invoice = new Invoice();
        invoice.invoiceUser = userId;
        invoice.paymentMethod = paymentMethod;
        invoice.note = note;
        invoice.business = businessId;
        invoice.issuedAt = new Date(issuedAt);
        invoice.discountType = discountType;
        invoice.discountValue = discountValue;
        invoice.currency = currency;
        if (dueDate) invoice.dueDate = new Date(dueDate);
        invoice.subtotal = subtotal;
        invoice.discountAmount = totalDiscountAmount;
        invoice.totalAmount = subtotal; //will eventually include tax, etc
        invoice.payableAmount = invoice.totalAmount - invoice.discountAmount;

        entityManager.save(invoice);

        for (const item of items) {
          const { productId, quantity } = item;

          const product = await this.productRepository
            .withManager(entityManager)
            .findById(productId, {
              lock: { mode: 'pessimistic_write' },
            });

          if (!product)
            return this.responseService.sendError(
              ErrorMessage.NOT_FOUND('Product'),
              null,
              HttpStatus.NOT_FOUND,
            );

          const { costPrice, sellingPrice: price } = product;

          const totalItemPrice = quantity * price;
          subtotal += totalItemPrice;

          const discountAmount = this.couponRepository.getDiscountAmount({
            discountType,
            discountValue,
            amount: totalItemPrice,
          });

          totalDiscountAmount += discountAmount;

          //TODO: add support for product variant
          await this.invoiceItemRepository
            .withManager(entityManager)
            .createStrict({
              invoice: invoice.id,
              product: productId,
              quantity,
              unitCostPrice: costPrice,
              unitPrice: price,
              discountAmount,
              subtotal: totalItemPrice,
            });
        }

        invoice.subtotal = subtotal;
        invoice.discountAmount = totalDiscountAmount;
        invoice.totalAmount = subtotal; //will eventually include tax, etc
        invoice.payableAmount = invoice.totalAmount - invoice.discountAmount;

        entityManager.save(invoice);

        const data = this.invoiceSanitizer.formatInvoiceForList(invoice);

        return this.responseService.sendSuccess(
          SuccessMessage.OPERATION_SUCCESSFUL,
          data,
          HttpStatus.CREATED,
        );
      },
    );

    return response;
  }

  async getInvoice(id: UUID) {
    const invoice = await this.invoiceRepository.findById(id, {
      relations: [
        'business',
        'invoiceUser',
        'invoiceItems',
        'invoiceItems.product',
      ],
    });

    if (!invoice)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Invoice'),
        null,
        HttpStatus.NOT_FOUND,
      );

    const data = this.invoiceSanitizer.formatInvoice(invoice);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
    );
  }

  async getInvoices(data: GetInvoicesDTO) {
    const {
      page,
      limit,
      sort,
      user: users,
      issuedAt,
      dueDate,
      business: businesses,
    } = data;

    let query: SelectQueryBuilder<Invoice> = this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.deletedAt IS NULL');

    if (businesses?.length > 0) {
      query.andWhere('invoice.business IN (:...businesses)', { businesses });
    }

    if (users?.length > 0) {
      query.andWhere('invoice.user IN (:...users)', { users });
    }

    if (issuedAt) {
      const issuedAtFilter = Util.parseDateFilter(issuedAt);

      query = QueryUtil.applyRangeFilter(
        query,
        'invoice',
        'issuedAt',
        issuedAtFilter,
      );
    }

    if (dueDate) {
      const dueDateFilter = Util.parseDateFilter(dueDate);

      query = QueryUtil.applyRangeFilter(
        query,
        'invoice',
        'duedate',
        dueDateFilter,
      );
    }

    const sortFieldsMap = {
      issuedDate: 'issuedDate',
      dueDate: 'dueDate',
      subtotal: 'subtotal',
      discountAmount: 'discountAmount',
      totalAmount: 'totalAmount',
      payableAmount: 'payableAmount',
    };

    const sortFilter = Util.parseSortParam(sort, sortFieldsMap);

    const { results: invoices, pagination } =
      await this.invoiceRepository.paginateWithQuery({
        query,
        pagination: { page, limit },
        sort: sortFilter,
      });

    const results = invoices.map((invoice) =>
      this.invoiceSanitizer.formatInvoiceForList(invoice),
    );

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { results, pagination },
    );
  }

  async updateInvoiceStatus(id: UUID, status: InvoiceStatus) {
    const invoice = isUUID(id)
      ? await this.invoiceRepository.findbyIdAndUpdate(
          id,
          { status },
          {
            relations: [
              'business',
              'invoiceUser',
              'invoiceItems',
              'invoiceItems.product',
            ],
          },
        )
      : null;

    if (!invoice)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Invoice'),
        null,
        HttpStatus.NOT_FOUND,
      );

    const data = this.invoiceSanitizer.formatInvoice(invoice);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
    );
  }
}
