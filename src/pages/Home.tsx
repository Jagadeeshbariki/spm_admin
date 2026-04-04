import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Topbar from '@/components/layout/Topbar';

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      // Set slow motion playback speed (0.75 as per user preference)
      videoRef.current.playbackRate = 0.75;
      
      // Attempt to play manually if the browser blocks initial autoplay
      videoRef.current.play().catch(err => {
        console.warn("Autoplay was prevented by the browser. Interaction might be required.", err);
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden">
      <div className="z-50">
        <Topbar />
      </div>
      
      <main className="flex-1 relative w-full h-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onLoadedData={() => {
            if (videoRef.current) videoRef.current.playbackRate = 0.75;
          }}
        >
          <source 
            src="https://res.cloudinary.com/dbohmpxko/video/upload/v1775136277/DJI_0104_gjau7k.mp4" 
            type="video/mp4" 
          />
          Your browser does not support the video tag.
        </video>

        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />

        {/* Dashboard Link Overlay */}
        <Link 
          to="/admin/dashboard" 
          className="absolute bottom-8 right-8 z-50 bg-blue-600/80 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold backdrop-blur-sm transition-all hover:scale-105 shadow-xl"
        >
          Go to Dashboard
        </Link>
      </main>
    </div>
  );
}
