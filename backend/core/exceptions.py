from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_payload = {
            "success": False,
            "error": {
                "code": response.status_code,
                "message": _extract_message(response.data),
                "details": response.data,
            },
        }
        response.data = error_payload

    return response


def _extract_message(data):
    if isinstance(data, dict):
        if "detail" in data:
            detail = data["detail"]
            return str(detail) if not isinstance(detail, list) else detail[0]
        for value in data.values():
            if isinstance(value, list) and value:
                return str(value[0])
            if isinstance(value, str):
                return value
    if isinstance(data, list) and data:
        return str(data[0])
    return "An error occurred."
