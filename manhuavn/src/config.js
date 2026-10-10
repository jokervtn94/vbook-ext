let BASE_URL = "https://manhuavn2.com";
let BASE_API = "https://mhvn.truyensieuhay.com";
let BASE_IMAGE = "https://admin.manhuavn2.com/Pictures/Truyen/Large/";

// Normalize API filenames and full image URLs without introducing double slashes.
// The website serves actual JPEG covers from admin.manhuavn2.com.
function getCoverUrl(value) {
    if (!value) return "";
    var image = String(value).trim().replace(/&amp;/g, "&");
    if (!image) return "";
    if (image.indexOf("//") === 0) return "https:" + image;
    if (/^https?:\/\//i.test(image)) return image.replace(/^http:\/\//i, "https://");
    image = image.replace(/^\/+/, "");
    if (image.indexOf("Pictures/Truyen/Large/") === 0) {
        return "https://admin.manhuavn2.com/" + image;
    }
    return BASE_IMAGE + image;
}
