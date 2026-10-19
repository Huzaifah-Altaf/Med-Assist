import unittest
from unittest.mock import Mock, patch

import gemini_client


class GeminiClientTests(unittest.TestCase):
    def setUp(self):
        gemini_client._client = None

    def tearDown(self):
        gemini_client._client = None

    def test_uses_stable_model_and_retries_transient_requests(self):
        fake_client = Mock()
        fake_client.models.generate_content.return_value.text = "  A concise explanation.  "

        with patch.dict("os.environ", {"GEMINI_API_KEY": "test-key"}), patch.object(
            gemini_client.genai, "Client", return_value=fake_client
        ) as client_constructor:
            explanation = gemini_client.generate_explanation(
                predicted_condition="Fungal infection",
                safety_warnings=[],
                graph_relationships=[],
                relevant_guidelines=[],
                symptoms=["itching"],
                conditions=[],
                medications=[],
            )

        self.assertEqual(explanation, "A concise explanation.")
        client_constructor.assert_called_once()
        http_options = client_constructor.call_args.kwargs["http_options"]
        self.assertEqual(http_options.timeout, 20_000)
        self.assertEqual(http_options.retry_options.attempts, 3)
        self.assertEqual(http_options.retry_options.http_status_codes, [408, 429, 500, 502, 503, 504])
        self.assertEqual(
            fake_client.models.generate_content.call_args.kwargs["model"],
            gemini_client.DEFAULT_MODEL,
        )

    def test_missing_key_is_reported_when_explanation_is_requested(self):
        with patch.dict("os.environ", {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "GEMINI_API_KEY is not configured"):
                gemini_client._get_client()


if __name__ == "__main__":
    unittest.main()
