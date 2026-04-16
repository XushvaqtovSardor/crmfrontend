function isHttpUrl(value) {
  const text = String(value || '').trim().toLowerCase();
  return text.startsWith('http://') || text.startsWith('https://');
}

export function parseAttachment(value) {
  const raw = String(value || '').trim();

  if (!raw) {
    return {
      raw: '',
      fileName: '',
      link: '',
      isStructured: false,
    };
  }

  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.type === 'attachment-v1') {
        const fileName = String(parsed.fileName || '').trim();
        const link = String(parsed.link || '').trim();

        return {
          raw,
          fileName,
          link,
          isStructured: true,
        };
      }
    } catch {
      // Fallback to plain-text behavior below.
    }
  }

  if (isHttpUrl(raw)) {
    return {
      raw,
      fileName: '',
      link: raw,
      isStructured: false,
    };
  }

  return {
    raw,
    fileName: raw,
    link: '',
    isStructured: false,
  };
}

export function serializeAttachment({ fileName = '', link = '' } = {}) {
  const normalizedFile = String(fileName || '').trim();
  const normalizedLink = String(link || '').trim();

  if (!normalizedFile && !normalizedLink) {
    return '';
  }

  if (normalizedFile && !normalizedLink) {
    return normalizedFile;
  }

  if (!normalizedFile && normalizedLink) {
    return normalizedLink;
  }

  return JSON.stringify({
    type: 'attachment-v1',
    fileName: normalizedFile,
    link: normalizedLink,
  });
}

export function getAttachmentLabel(value) {
  const parsed = parseAttachment(value);

  if (parsed.fileName) return parsed.fileName;
  if (parsed.link) {
    try {
      const url = new URL(parsed.link);
      const last = url.pathname.split('/').filter(Boolean).at(-1);
      return last || parsed.link;
    } catch {
      return parsed.link;
    }
  }

  return '--';
}
