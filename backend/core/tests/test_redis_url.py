from django.test import SimpleTestCase

from config.redis_url import ensure_redis_ssl_cert_reqs


class EnsureRedisSslCertReqsTests(SimpleTestCase):
    def test_leaves_plain_redis_unchanged(self):
        url = "redis://localhost:6379/1"
        self.assertEqual(ensure_redis_ssl_cert_reqs(url), url)

    def test_appends_ssl_cert_reqs_to_rediss(self):
        url = "rediss://default:secret@upstash.io:6379/0"
        self.assertEqual(
            ensure_redis_ssl_cert_reqs(url),
            "rediss://default:secret@upstash.io:6379/0?ssl_cert_reqs=CERT_REQUIRED",
        )

    def test_preserves_existing_query_and_ssl_param(self):
        url = "rediss://host:6379/0?db=0&ssl_cert_reqs=CERT_NONE"
        self.assertEqual(ensure_redis_ssl_cert_reqs(url), url)

    def test_appends_alongside_existing_query(self):
        url = "rediss://host:6379/0?foo=bar"
        self.assertEqual(
            ensure_redis_ssl_cert_reqs(url, cert_reqs="CERT_NONE"),
            "rediss://host:6379/0?foo=bar&ssl_cert_reqs=CERT_NONE",
        )

    def test_empty_url(self):
        self.assertEqual(ensure_redis_ssl_cert_reqs(""), "")
