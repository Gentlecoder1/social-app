import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','socialapp.settings')
import django
django.setup()
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
print('STORAGE:', type(default_storage))
content = ContentFile(b'test-content')
name = default_storage.save('debug_test/testfile.txt', content)
print('SAVED NAME:', name)
print('EXISTS IN DEFAULT_STORAGE:', default_storage.exists(name))
# Check local media/ path
print('LOCAL MEDIA EXISTS:', os.path.exists(os.path.join(os.getcwd(),'media',name)))
