import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Topbar from '@/components/layout/Topbar';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      // Set slow motion playback speed (0.75 as per user preference)
      videoRef.current.playbackRate = 0.75;
      
      // Attempt to play manually if the browser blocks initial autoplay
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn("Autoplay was prevented by the browser. Interaction might be required.", err);
        setIsPlaying(false);
      });
    }
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

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
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onLoadedData={() => {
            if (videoRef.current) videoRef.current.playbackRate = 0.75;
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source 
            src="https://res.cloudinary.com/dbohmpxko/video/upload/v1775136277/DJI_0104_gjau7k.mp4" 
            type="video/mp4" 
          />
          Your browser does not support the video tag.
        </video>

        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />

        {/* Video Controls Overlay */}
        <div className="absolute bottom-8 left-8 z-50 flex items-center gap-3">
          <button 
            onClick={togglePlay}
            className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all shadow-lg"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <button 
            onClick={toggleMute}
            className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all shadow-lg"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

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
