#!/usr/bin/env python3
# Saheli local dev server: sets the COOP/COEP headers the voice engine's
# WASM threads need. Usage: python3 serve.py  ->  http://localhost:8130
import http.server, socketserver

PORT = 8130

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        http.server.SimpleHTTPRequestHandler.end_headers(self)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Saheli at http://localhost:%d" % PORT)
    httpd.serve_forever()
