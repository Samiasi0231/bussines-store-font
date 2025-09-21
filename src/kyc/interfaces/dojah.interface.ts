export interface DojahBvnResponseData {
  entity: {
    bvn: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    gender: string;
    date_of_birth: string;
    phone_number1: string;
    image: string;
    phone_number2: string;
  };
}

export interface DojahNinResponseData {
  entity: {
    first_name: string;
    last_name: string;
    gender: string;
    middle_name: string;
    photo: string;
    date_of_birth: string;
    email: string;
    phone_number: string;
    employment_status: string;
    marital_status: string;
  };
}
