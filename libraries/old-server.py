'''
from http.server import SimpleHTTPRequestHandler, HTTPServer
import os, json, getpass

def get_username_plain():
    # Prefer DOMAIN\user if available; else fall back to getpass/os.getlogin
    dom = os.environ.get("USERDOMAIN")
    usr = os.environ.get("USERNAME") or getpass.getuser()
    return f"{dom}\\{usr}" if dom and usr else usr or "unknown"

class CustomHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Optional: allow fetch() from same origin; add CORS if you need cross-origin
        # self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_GET(self):
        if self.path == "/username":
            # plain text username (just the short name)
            short = (get_username_plain() or "").split("\\")[-1]
            self.send_response(200)
            self.send_header("Content-type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(short.encode("utf-8"))
            return

        if self.path == "/whoami":
            # DOMAIN\user as JSON
            self.send_response(200)
            self.send_header("Content-type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"user": get_username_plain()}).encode("utf-8"))
            return

        super().do_GET()

    def do_POST(self):
        if self.path == "/save-access":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data)
                csv_data = payload.get("csv", "")
                if csv_data:
                    os.makedirs("config", exist_ok=True)
                    with open("config/access.csv", "w", encoding="utf-8") as f:
                        f.write(csv_data)
                    self.send_response(200); self.end_headers()
                    self.wfile.write(b"Access matrix saved.")
                else:
                    self.send_response(400); self.end_headers()
                    self.wfile.write(b"Missing CSV data.")
            except Exception as e:
                print("Error saving CSV:", e)
                self.send_response(500); self.end_headers()
                self.wfile.write(b"Internal server error.")
            return
        super().do_POST()

if __name__ == "__main__":
    server_address = ("0.0.0.0", 8000)
    httpd = HTTPServer(server_address, CustomHandler)
    print("Server running on port 8000...")
    httpd.serve_forever()
'''

from http.server import SimpleHTTPRequestHandler, HTTPServer
import os, json

class CustomHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # CORS is harmless on same-origin and useful if you ever debug cross-origin
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        SimpleHTTPRequestHandler.end_headers(self)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/username":
            username = os.getlogin()
            self.send_response(200)
            self.send_header("Content-type", "text/plain; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(username.encode("utf-8"))
            print(f"[server] /username -> {username}")
            return
        super().do_GET()

    def do_POST(self):
        if self.path == "/save-access":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                payload = json.loads(body)
                csv_data = payload.get("csv", "")
                if csv_data:
                    os.makedirs("config", exist_ok=True)
                    with open("config/access.csv", "w", encoding="utf-8") as f:
                        f.write(csv_data)
                    self.send_response(200); self.end_headers()
                    self.wfile.write(b"Access matrix saved.")
                else:
                    self.send_response(400); self.end_headers()
                    self.wfile.write(b"Missing CSV data.")
            except Exception as e:
                print("Error saving CSV:", e)
                self.send_response(500); self.end_headers()
                self.wfile.write(b"Internal server error.")

if __name__ == "__main__":
    server_address = ("0.0.0.0", 8000)
    print("Server running on port 8000...")
    HTTPServer(server_address, CustomHandler).serve_forever()
