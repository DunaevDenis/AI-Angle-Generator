import React, { useState, useCallback } from 'react';
import { generateImageViews } from './services/geminiService';

interface UploadedImage {
  base64: string;
  mimeType: string;
}

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const [header, base64] = result.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
        setUploadedImage({ base64, mimeType });
        setGeneratedImages([]);
        setError(null);
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateClick = useCallback(async () => {
    if (!uploadedImage) {
      setError("Please upload an image first.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const images = await generateImageViews(uploadedImage.base64, uploadedImage.mimeType);
      setGeneratedImages(images);
    } catch (err: any) {
      console.error(err);
      setError(`Failed to generate images. ${err.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImage]);

  const handleReset = () => {
    setUploadedImage(null);
    setGeneratedImages([]);
    setError(null);
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans">
      <Header />
      <main className="w-full max-w-6xl flex flex-col items-center">
        <ImageUploader onImageUpload={handleImageUpload} uploadedImage={uploadedImage} />

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={handleGenerateClick}
            disabled={!uploadedImage || isLoading}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Spinner />
                Generating...
              </>
            ) : (
              'Generate 4 New Angles'
            )}
          </button>
          {uploadedImage && (
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="px-8 py-3 bg-gray-700 text-white font-bold rounded-lg shadow-lg hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Upload Another Photo
            </button>
          )}
        </div>

        {error && <ErrorMessage message={error} />}

        <GeneratedImagesDisplay isLoading={isLoading} generatedImages={generatedImages} />
      </main>
    </div>
  );
};

const Header: React.FC = () => (
  <header className="text-center mb-8 md:mb-12">
    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
      AI Angle Generator
    </h1>
    <p className="mt-2 text-lg text-gray-400 max-w-2xl mx-auto">
      Upload an image and let Gemini generate four new perspectives. See your subject from the right, left, behind, and above.
    </p>
  </header>
);

const ImageUploader: React.FC<{ onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; uploadedImage: UploadedImage | null; }> = ({ onImageUpload, uploadedImage }) => (
  <div className="w-full max-w-lg bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-6 text-center transition-colors duration-300 hover:border-indigo-500">
    <input
      type="file"
      id="imageUpload"
      accept="image/*"
      onChange={onImageUpload}
      className="hidden"
    />
    <label htmlFor="imageUpload" className="cursor-pointer flex flex-col items-center">
      {uploadedImage ? (
        <img src={`data:${uploadedImage.mimeType};base64,${uploadedImage.base64}`} alt="Uploaded preview" className="max-h-64 rounded-lg object-contain" />
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-indigo-400 font-semibold">Click to upload an image</span>
          <span className="text-sm text-gray-500 mt-1">PNG, JPG, GIF, WEBP</span>
        </>
      )}
    </label>
  </div>
);

const GeneratedImagesDisplay: React.FC<{ isLoading: boolean; generatedImages: string[] }> = ({ isLoading, generatedImages }) => {
  if (isLoading && generatedImages.length === 0) {
    return (
      <div className="mt-12 text-center text-gray-400">
        <p>AI is thinking... this may take a moment.</p>
      </div>
    );
  }

  if (generatedImages.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-12">
      <h2 className="text-2xl font-bold text-center mb-6">Generated Angles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {generatedImages.map((imgSrc, index) => (
          <div key={index} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden animate-fade-in">
            <img src={imgSrc} alt={`Generated angle ${index + 1}`} className="w-full h-auto object-cover" />
            <div className="p-4 bg-gray-800/50">
              <p className="font-semibold text-center text-gray-300">
                {['From the Right', 'From the Left', 'From Behind', 'From Above'][index]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Spinner: React.FC = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="mt-6 w-full max-w-lg bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center" role="alert">
    <span className="font-bold">Error: </span>
    <span className="block sm:inline">{message}</span>
  </div>
);

export default App;