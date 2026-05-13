export interface ApiErrorPayload {
  code: string;
  message: string;
}

export interface ApiSuccessEnvelope<TData> {
  success: true;
  data: TData;
  error: null;
}

export interface ApiErrorEnvelope {
  success: false;
  data: null;
  error: ApiErrorPayload;
}

export type ApiEnvelope<TData> = ApiSuccessEnvelope<TData> | ApiErrorEnvelope;

export function apiOk<TData>(data: TData, init?: ResponseInit): Response {
  return Response.json(
    {
      success: true,
      data,
      error: null,
    } satisfies ApiSuccessEnvelope<TData>,
    init,
  );
}

export function apiError(code: string, message: string, status = 400): Response {
  return Response.json(
    {
      success: false,
      data: null,
      error: {
        code,
        message,
      },
    } satisfies ApiErrorEnvelope,
    { status },
  );
}
