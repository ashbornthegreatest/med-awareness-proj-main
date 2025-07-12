const axios = require("axios");
const FormData = require("form-data");

const IMGBB_API_URL = "https://api.imgbb.com/1/upload";

async function uploadImageToImgbb(image) {
    const apiKey = 'a19de2c4e34471289fcb3a29fe1d8ef4';
    const apiUrl = new URL(IMGBB_API_URL);
    apiUrl.searchParams.append("key", apiKey);
    apiUrl.searchParams.append("expiration", "1000"); // 30 days in seconds
  
    const formData = new FormData();
    formData.append("image", image);
  
    try {
      const response = await axios.post(apiUrl, formData);
  
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(
          `Failed to upload image. Status code: ${response.status}`,
        );
      }
    } catch (error) {
      console.log({ error })
      throw new Error(`Error uploading image: ${error.message}.`);
    }
}

module.exports = {
    uploadImageToImgbb,
}