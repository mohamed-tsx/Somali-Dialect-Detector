import AudioUploader from "./AudioUpload";

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-3xl">
        <h1 className="mb-8 text-center text-3xl font-bold">Audio Uploader</h1>
        <AudioUploader />
      </div>
    </main>
  );
}
