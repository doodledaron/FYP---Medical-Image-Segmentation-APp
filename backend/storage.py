from django.core.files.storage import FileSystemStorage

class WSLCompatibleFileStorage(FileSystemStorage):
    def _save(self, name, content):
        # Bypass chmod by not calling parent _save's chmod logic
        full_path = super()._save(name, content)
        return full_path
