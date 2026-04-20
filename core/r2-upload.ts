export async function uploadImageToR2(file: File, folder = "products"): Promise<string> {
  const dataUrl = await fileToDataUrl(file);

  const explicitEndpoint = (import.meta as any).env?.VITE_R2_UPLOAD_ENDPOINT as string | undefined;
  const defaultEndpoint = "/api/r2-upload";
  const endpoint = explicitEndpoint || defaultEndpoint;

  if (window.location.hostname === "localhost" && !explicitEndpoint) {
    throw new Error("Local upload endpoint is not configured. Set VITE_R2_UPLOAD_ENDPOINT.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      dataUrl,
      folder,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || "R2 upload failed.");
  }

  return payload.url as string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}
