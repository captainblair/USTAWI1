from django.urls import path

from apps.payments.views.landlord import (
    LandlordCollectedPaymentsView,
    LandlordIncomeSummaryView,
    LandlordPayoutMethodListCreateView,
    LandlordSubscriptionView,
)
from apps.payments.views.tenant import (
    TenantInvoiceListView,
    TenantPayRentView,
    TenantPaymentHistoryView,
    TenantPaymentStatusView,
    TenantReceiptDetailView,
    TenantRentDueView,
)
from apps.payments.views.webhooks import DevSimulateCallbackView, MpesaCallbackView

tenant_urlpatterns = [
    path("invoices/", TenantInvoiceListView.as_view(), name="tenant-invoice-list"),
    path("rent-due/", TenantRentDueView.as_view(), name="tenant-rent-due"),
    path("pay-rent/", TenantPayRentView.as_view(), name="tenant-pay-rent"),
    path("history/", TenantPaymentHistoryView.as_view(), name="tenant-payment-history"),
    path("payments/<uuid:pk>/", TenantPaymentStatusView.as_view(), name="tenant-payment-status"),
    path("receipts/<uuid:pk>/", TenantReceiptDetailView.as_view(), name="tenant-receipt-detail"),
]

landlord_urlpatterns = [
    path("collected/", LandlordCollectedPaymentsView.as_view(), name="landlord-payments-collected"),
    path("summary/", LandlordIncomeSummaryView.as_view(), name="landlord-income-summary"),
    path("payout-methods/", LandlordPayoutMethodListCreateView.as_view(), name="landlord-payout-methods"),
    path("subscription/", LandlordSubscriptionView.as_view(), name="landlord-subscription"),
]

webhook_urlpatterns = [
    path("mpesa/", MpesaCallbackView.as_view(), name="mpesa-callback"),
    path("dev/simulate-callback/", DevSimulateCallbackView.as_view(), name="dev-simulate-callback"),
]
