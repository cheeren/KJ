import os
from flask import Flask, send_from_directory

app = Flask(__name__)
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
prefix = os.getenv('GIZMOAPP_URL_PREFIX', '').rstrip('/')

def _index():
    return send_from_directory(root, 'index.html')

def _static(filename):
    return send_from_directory(root, filename)

app.add_url_rule(prefix + '/',             'index',       _index)
app.add_url_rule(prefix + '/index.html',   'index_html',  _index)
app.add_url_rule(prefix + '/<path:filename>', 'static',   _static)
