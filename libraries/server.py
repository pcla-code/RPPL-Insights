# libraries/server.py
# jn.visualizer.orgdata-guard.v5

from http.server import SimpleHTTPRequestHandler, HTTPServer
import os
import sys

PORT = 8000


class CustomHandler(SimpleHTTPRequestHandler):
    """
    Dev static server with:
      - No directory listings
      - Root (/) -> index.html
      - orgdata/* (any depth, any filename):
          * ALLOWED only when request has header: X-Visualizer-Fetch: 1
          * BLOCKED for anything typed in the browser / clicked directly
      - Cache disabled to avoid old CSVs being served from cache
    """

    # ---------- Helpers ----------

    def _is_visualizer_fetch(self) -> bool:
        return self.headers.get("X-Visualizer-Fetch") == "1"

    # ---------- Disable directory listings ----------

    def list_directory(self, path):
        self.send_error(403, "Directory listing is disabled (v5)")
        return None

    # ---------- Global cache control ----------

    def end_headers(self):
        # Disable caching to avoid stale CSVs showing up from browser cache
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    # ---------- Main GET handler ----------

    def do_GET(self):
        # Normalize root to your main page
        if self.path == "/" or self.path == "/index.html":
            # If you renamed the entry page, update here
            self.path = "/index.html"   # or "/visualizer.html"
            return super().do_GET()

        # Block ANY naked folder URL (ends with slash)
        if self.path.endswith("/"):
            self.send_error(403, "Directory access is forbidden (v5)")
            return

        # Let the base class handle files; we’ll guard orgdata in send_head
        return super().do_GET()

    # ---------- Core file-level guard ----------

    def send_head(self):
        """
        This is called by do_GET and do_HEAD to open files.
        We hook here to block any access to orgdata/* unless it comes from
        the visualizer (has X-Visualizer-Fetch: 1).
        """
        raw_path = self.path  # URL path (e.g. /orgdata/org1_classroom_observation.csv)

        # 🔒 Global orgdata guard (any depth, any file)
        if raw_path.startswith("/orgdata/") and not self._is_visualizer_fetch():
            self.send_error(403, "Direct access to data files is forbidden (v5)")
            return None

        # For everything else, fall back to the normal behavior
        return super().send_head()

    # ---------- Quieter logs ----------

    def log_message(self, fmt, *args):
        sys.stderr.write("[server] " + (fmt % args) + "\n")


if __name__ == "__main__":
    # Serve from project root (one level up from libraries/)
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)

    server_address = ("0.0.0.0", PORT)
    httpd = HTTPServer(server_address, CustomHandler)
    print(f"[server] v5 running from {root} on http://localhost:{PORT}/ ...")
    httpd.serve_forever()
