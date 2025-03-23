import os
import sys

# Add the parent directory (which should be /app/Server) to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Server.settings")
application = get_wsgi_application()
