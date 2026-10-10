let BASE_URL = 'https://omegascans.org';
function omegaCover(value) {
    var image = String(value || '').replace(/&amp;/g, '&').trim();
    if (image.indexOf('/_next/image?') === 0) {
        var match = image.match(/[?&]url=([^&]+)/);
        image = match ? decodeURIComponent(match[1]) : image;
    }
    if (image.indexOf('//') === 0) return 'https:' + image;
    if (image.charAt(0) === '/') return BASE_URL + image;
    return image;
}
