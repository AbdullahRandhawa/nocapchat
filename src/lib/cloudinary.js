
const upload = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
            {
                method: "POST",
                body: formData,
            }
        );
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Cloudinary upload failed");
        }

        return data.secure_url;
    } catch (err) {
        console.error("Cloudinary Error:", err);
        throw err;
    }
};

export default upload;