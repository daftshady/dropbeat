# The MIT License (MIT)

# Copyright (c) 2014 Park Il Su

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

"""Simple HTTPServer for running `Dropbeat` in local environment easily.
This server uses python default `HTTPServer` library because we thought anyone
who want to develop or run `Dropbeat` in his local environment can do it
with standalone server without installing other third-party web framework.
Although this server should not be used in production-level, it's fair enough
if it's used in development-level only.
This server is compatible with both python 2.x and 3.x.

Usage::
    python run_dropbeat.py | python run_dropbeat.py HOST:PORT

"""

import sys
from mimetypes import guess_type
try:
    # Python 2.x
    from urlparse import urlparse
    from BaseHTTPServer import HTTPServer, BaseHTTPRequestHandler
except ImportError:
    # Python 3.x
    from urllib.parse import urlparse
    from http.server import  HTTPServer, BaseHTTPRequestHandler


class DropbeatHandler(BaseHTTPRequestHandler):
    _INDEX_FILENAME = 'beat.html'

    def do_GET(self):
        """Serves get request.
        This method reads static files in `Dropbeat` directory and writes it
        to HTTP response with appropriate `Content-Type` header.
        XXX: NOTE that filename `beat.html` for serving path '/' is hard-coded.
        (it's reasonable because if `Dropbeat` has multiple html file,
        it's very strange to detect index file name automatically.)
        Therefore, if you change the filename of `beat.html`, this server may
        not serve `Dropbeat` properly.

        """
        parsed_path = urlparse(self.path)
        path = parsed_path.path[1:]
        file_path = self._INDEX_FILENAME if not path else path
        try:
            with open(file_path, 'rb') as file_:
                self.send_response(200)
                self.send_header('Content-Type', guess_type(path)[0])
                self.end_headers()
                self.wfile.write(file_.read())
        except IOError:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'File %s not found' % file_path)


if __name__ == '__main__':
    def raise_error():
        print('[Usage]: python %s 127.0.0.1:9000' % sys.argv[0])
        sys.exit()

    if len(sys.argv) == 1:
        addr = ('', 9000)
    elif len(sys.argv) == 2:
        addr = sys.argv[1].split(':')
        try:
            addr = (addr[0], int(addr[1]))
        except (IndexError, ValueError) as e:
            raise_error()
    else:
        raise_error()

    httpd = HTTPServer(addr, DropbeatHandler)
    try:
        addr = httpd.socket.getsockname()
        print('Dropbeat started in %s' % str(addr))
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('Dropbeat closed by keyboard interrupt')
    except:
        print('Unexpected error occured: ' + str(sys.exc_info()[:2]))
    httpd.server_close()
