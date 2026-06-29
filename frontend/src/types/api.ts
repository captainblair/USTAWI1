export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiPaginated<T> = {
  success: true;
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ApiError = {
  success: false;
  error: {
    message: string;
    code?: number;
    details?: Record<string, string[]>;
  };
};

export class ApiRequestError extends Error {
  status: number;
  details?: Record<string, string[]>;

  constructor(message: string, status: number, details?: Record<string, string[]>) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}
