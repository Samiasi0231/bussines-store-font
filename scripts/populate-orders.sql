-- SQL Script to populate orders with sample data
BEGIN;

DO $$
DECLARE
    user_id_var uuid := '019b7134-42b2-7f40-a5da-05085cf1bf5a'; -- SET NULL TO POPULATE WITH RANDOM USER
    number_of_orders int := 15;
    i int;
    j int;
    order_id_val uuid;
    order_status text;
    payment_method_val text;
    payment_status_val text;
    order_date timestamp;
    days_ago int;
    subtotal_val bigint;
    discount_val int;
    tax_val int;
    shipping_val int;
    total_val bigint;
    payable_val bigint;
    is_in_store boolean;
    user_id_to_use uuid;
    address_id_val uuid;
    product_rec record;
    order_item_count int;
    payment_ref text;
    order_note text;
    item_quantity int;
    item_unit_price int;
    item_discount int;
    item_subtotal bigint;
    rand_val numeric;
    age_factor numeric;
    order_uuid uuid;
    in_store_data jsonb;
    updated_date timestamp;
    notes text[] := ARRAY[NULL, 'Please deliver before 5pm', 'Gift wrapping requested', 'Rush delivery', 'Bulk order for office', 'Used promotional code'];
BEGIN
    DROP TABLE IF EXISTS script_config;
    CREATE TEMP TABLE script_config (
        user_id uuid,
        num_orders int
    );

    INSERT INTO script_config (user_id, num_orders) VALUES (user_id_var, number_of_orders);

    DROP TABLE IF EXISTS generated_orders;
    CREATE TEMP TABLE generated_orders (
        order_id uuid,
        payment_ref text
    );

    FOR i IN 1..number_of_orders LOOP
        is_in_store := (i % 6 = 0);

        IF is_in_store THEN
            user_id_to_use := NULL;
        ELSE
            IF user_id_var IS NULL THEN
                SELECT id INTO user_id_to_use FROM users WHERE deleted_at IS NULL ORDER BY RANDOM() LIMIT 1;
            ELSE
                user_id_to_use := user_id_var;
            END IF;
        END IF;

        days_ago := (i * 0.8)::int;
        IF days_ago = 0 THEN
            order_date := NOW() - INTERVAL '2 hours';
        ELSE
            order_date := NOW() - (days_ago || ' days')::interval;
        END IF;

        rand_val := random();
        age_factor := LEAST(1.0, days_ago / 12.0);

        IF age_factor < 0.3 THEN
            IF rand_val < 0.40 THEN
                order_status := 'pending';
            ELSIF rand_val < 0.70 THEN
                order_status := 'processing';
            ELSIF rand_val < 0.85 THEN
                order_status := 'shipped';
            ELSIF rand_val < 0.95 THEN
                order_status := 'completed';
            ELSE
                order_status := 'cancelled';
            END IF;
        ELSIF age_factor < 0.7 THEN
            IF rand_val < 0.25 THEN
                order_status := 'pending';
            ELSIF rand_val < 0.45 THEN
                order_status := 'processing';
            ELSIF rand_val < 0.65 THEN
                order_status := 'shipped';
            ELSIF rand_val < 0.95 THEN
                order_status := 'completed';
            ELSE
                order_status := 'cancelled';
            END IF;
        ELSE
            IF rand_val < 0.10 THEN
                order_status := 'pending';
            ELSIF rand_val < 0.20 THEN
                order_status := 'processing';
            ELSIF rand_val < 0.40 THEN
                order_status := 'shipped';
            ELSIF rand_val < 0.95 THEN
                order_status := 'completed';
            ELSE
                order_status := 'cancelled';
            END IF;
        END IF;

        IF is_in_store THEN
            payment_method_val := 'cash';
        ELSE
            CASE floor(random() * 6)::int
                WHEN 0 THEN payment_method_val := 'card';
                WHEN 1 THEN payment_method_val := 'bank_transfer';
                WHEN 2 THEN payment_method_val := 'cash';
                WHEN 3 THEN payment_method_val := 'ussd';
                WHEN 4 THEN payment_method_val := 'direct_debit';
                ELSE payment_method_val := 'checkout';
            END CASE;
        END IF;

        IF order_status = 'completed' THEN
            payment_status_val := 'paid';
        ELSIF order_status = 'shipped' THEN
            payment_status_val := 'paid';
        ELSIF order_status = 'cancelled' THEN
            payment_status_val := 'failed';
        ELSIF order_status = 'processing' THEN
            IF random() < 0.7 THEN
                payment_status_val := 'paid';
            ELSE
                payment_status_val := 'pending';
            END IF;
        ELSE
            IF random() < 0.2 THEN
                payment_status_val := 'paid';
            ELSE
                payment_status_val := 'pending';
            END IF;
        END IF;

        subtotal_val := 0;
        discount_val := 0;
        tax_val := 0;
        shipping_val := CASE WHEN is_in_store THEN 0 ELSE (1000 + floor(random() * 5000))::int END;
        total_val := 0;
        payable_val := 0;

        IF is_in_store THEN
            address_id_val := NULL;
        ELSE
            SELECT id INTO address_id_val FROM addresses WHERE deleted_at IS NULL ORDER BY RANDOM() LIMIT 1;
        END IF;

        payment_ref := 'PAY-ORDER' || LPAD(i::text, 3, '0') || '-' || SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8);
        order_note := notes[1 + (floor(random() * array_length(notes, 1))::int % array_length(notes, 1))];
        order_uuid := gen_random_uuid();

        in_store_data := CASE WHEN is_in_store THEN
            jsonb_build_object(
                'name', 'John Doe',
                'email', 'john.doe' || i || '@example.com',
                'phone', '+2348012345678'
            )
        ELSE NULL END;

        updated_date := CASE WHEN order_status = 'completed' THEN order_date - INTERVAL '2 days' ELSE order_date END;

        -- Insert with proper enum casting for all three enum columns
        EXECUTE format('
            INSERT INTO orders (
                id, user_id, date, status, subtotal, discount_amount, tax,
                shipping_amount, total_amount, payable_amount, shipping_address_id,
                payment_method, payment_status, note, payment_reference,
                in_store_order, in_store_order_data, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4::orders_status_enum, $5, $6, $7, $8, $9, $10, $11,
                $12::orders_payment_method_enum, $13::orders_payment_status_enum, $14, $15, $16, $17, $18, $19
            ) RETURNING id'
        )
        USING
            order_uuid,
            user_id_to_use,
            order_date,
            order_status,
            subtotal_val,
            discount_val,
            tax_val,
            shipping_val,
            total_val,
            payable_val,
            address_id_val,
            payment_method_val,
            payment_status_val,
            order_note,
            payment_ref,
            is_in_store,
            in_store_data,
            order_date,
            updated_date
        INTO order_id_val;

        order_item_count := 1 + floor(random() * 3)::int;
        subtotal_val := 0;
        discount_val := 0;

        IF EXISTS (SELECT 1 FROM products WHERE deleted_at IS NULL) THEN
            FOR j IN 1..order_item_count LOOP
                SELECT id, store_id, "sellingPrice", "costPrice" INTO product_rec
                FROM products
                WHERE deleted_at IS NULL
                ORDER BY RANDOM()
                LIMIT 1;

                IF product_rec.id IS NOT NULL THEN
                    item_quantity := 1 + floor(random() * 3)::int;
                    item_unit_price := product_rec."sellingPrice";
                    item_discount := CASE WHEN random() > 0.7 THEN floor(item_unit_price * item_quantity * 0.1)::int ELSE 0 END;
                    item_subtotal := (item_unit_price * item_quantity - item_discount)::bigint;

                    INSERT INTO order_items (
                        id,
                        order_id,
                        store_id,
                        product_id,
                        product_variant_id,
                        quantity,
                        unit_price,
                        unit_cost_price,
                        discount_amount,
                        subtotal,
                        created_at,
                        updated_at
                    ) VALUES (
                        gen_random_uuid(),
                        order_id_val,
                        product_rec.store_id,
                        product_rec.id,
                        NULL,
                        item_quantity,
                        item_unit_price,
                        product_rec."costPrice",
                        item_discount,
                        item_subtotal,
                        order_date,
                        order_date
                    );

                    subtotal_val := subtotal_val + (item_unit_price * item_quantity)::bigint;
                    discount_val := discount_val + item_discount;
                END IF;
            END LOOP;
        ELSE
            RAISE NOTICE 'Warning: No products found. Order % will have zero totals.', payment_ref;
        END IF;

        tax_val := floor(subtotal_val * 0.1)::int;
        total_val := subtotal_val + tax_val + shipping_val;
        payable_val := total_val - discount_val;

        UPDATE orders
        SET
            subtotal = subtotal_val,
            discount_amount = discount_val,
            tax = tax_val,
            total_amount = total_val,
            payable_amount = payable_val
        WHERE id = order_id_val;

        INSERT INTO generated_orders (order_id, payment_ref) VALUES (order_id_val, payment_ref);

    END LOOP;
END $$;

COMMIT;

SELECT
    'Order Summary' as report_type,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
    COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
    COUNT(CASE WHEN in_store_order = true THEN 1 END) as in_store_orders
FROM orders
WHERE payment_reference IN (SELECT payment_ref FROM generated_orders);

SELECT
    'Order Items Summary' as report_type,
    COUNT(*) as total_order_items
FROM order_items
WHERE order_id IN (SELECT order_id FROM generated_orders);

DROP TABLE IF EXISTS script_config;
DROP TABLE IF EXISTS generated_orders;