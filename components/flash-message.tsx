export function FlashMessage({
  message,
}: {
  message: { type: "success" | "error"; text: string } | null;
}) {
  if (!message) {
    return null;
  }

  const className =
    message.type === "success"
      ? "border-[#cce8d7] bg-[#effaf3] text-[#185c3d]"
      : "border-[#f4c7d4] bg-[#fff1f4] text-[#a43656]";

  return (
    <p className={`alert-message border text-sm leading-6 ${className}`}>{message.text}</p>
  );
}
