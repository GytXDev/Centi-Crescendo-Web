import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2, AlertCircle, Fullscreen, Maximize } from 'lucide-react';

function VideoPlayer({ videoUrl, title = "Vidéo", description = "", className = "" }) {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const videoRef = useRef(null);
    const controlsTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, []);

    if (!videoUrl) {
        return (
            <div
                className={`relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg md:rounded-2xl overflow-hidden flex items-center justify-center ${className}`}
                style={{
                    backgroundImage: 'url(/no_video.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                {/* Overlay sombre */}
                <div className="absolute inset-0 bg-black/40 md:bg-black/50 flex items-center justify-center transition-all duration-300">
                    <div className="text-center p-4 sm:p-6 md:p-8 w-full max-w-md mx-4">
                        {/* Icône avec effet de flou */}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gray-700/80 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 backdrop-blur-sm">
                            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gray-300" />
                        </div>

                        {/* Texte responsive */}
                        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-1 sm:mb-2">
                            Vidéo en préparation
                        </h3>
                        <p className="text-sm sm:text-base text-gray-300/90 px-2 sm:px-0">
                            {description ? (
                                <>
                                    {description}
                                    <span className="block mt-1">La vidéo sera disponible bientôt !</span>
                                </>
                            ) : (
                                <>
                                    Cette tombola marque le début d'une aventure excitante.
                                    <span className="block mt-1">La vidéo sera disponible bientôt !</span>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Effet de bordure subtile au hover */}
                <div className="absolute inset-0 border-2 border-transparent hover:border-white/10 rounded-lg md:rounded-2xl transition-all duration-300 pointer-events-none" />
            </div>
        );
    }

    const handleLoad = () => {
        setIsLoading(false);
        setHasError(false);
        hideControlsAfterDelay();
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
        showControlsTemporarily();
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
        showControlsTemporarily();
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(currentProgress);
        }
    };

    const handleProgressClick = (e) => {
        if (videoRef.current) {
            const rect = e.target.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoRef.current.currentTime = pos * videoRef.current.duration;
            setProgress(pos * 100);
        }
        showControlsTemporarily();
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoRef.current.parentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
        showControlsTemporarily();
    };

    const showControlsTemporarily = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        hideControlsAfterDelay();
    };

    const hideControlsAfterDelay = () => {
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 3000);
    };

    const handleMouseMove = () => {
        showControlsTemporarily();
    };

    return (
        <div
            className={`relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-xl group ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
                if (isPlaying) {
                    setShowControls(false);
                }
            }}
        >
            {/* Effet de brillance moderne */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            {/* État de chargement */}
            {isLoading && (
                <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                    <div className="text-center">
                        <div className="relative mx-auto mb-4">
                            <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
                        </div>
                        <p className="text-white font-medium">Chargement de la vidéo...</p>
                        <p className="text-gray-400 text-sm mt-1">Préparation du contenu</p>
                    </div>
                </div>
            )}

            {/* État d'erreur */}
            {hasError && (
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-red-800/20 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                    <div className="text-center p-6">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Erreur de chargement</h3>
                        <p className="text-gray-300 text-sm max-w-sm">
                            Impossible de charger la vidéo. Vérifiez l'URL ou la connexion réseau.
                        </p>
                        <button
                            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg transition-colors"
                            onClick={() => {
                                setIsLoading(true);
                                setHasError(false);
                            }}
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            )}

            {/* Lecteur vidéo */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    onLoadStart={handleLoad}
                    onLoadedData={handleLoad}
                    onError={handleError}
                    onTimeUpdate={handleTimeUpdate}
                    onClick={togglePlay}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%231f2937'/%3E%3C/svg%3E"
                >
                    <source src={videoUrl} type="video/mp4" />
                    <source src={videoUrl} type="video/webm" />
                    <source src={videoUrl} type="video/ogg" />
                    Votre navigateur ne supporte pas la lecture de vidéos.
                </video>

                {/* Overlay de contrôle */}
                <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                >
                    {/* Contrôles en bas */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        {/* Barre de progression */}
                        <div
                            className="h-1.5 bg-gray-600/50 rounded-full mb-3 cursor-pointer"
                            onClick={handleProgressClick}
                        >
                            <div
                                className="h-full bg-yellow-400 rounded-full relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        </div>

                        {/* Boutons de contrôle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <button
                                    className="text-white hover:text-yellow-400 transition-colors"
                                    onClick={togglePlay}
                                >
                                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                                </button>
                                <button
                                    className="text-white hover:text-yellow-400 transition-colors"
                                    onClick={toggleMute}
                                >
                                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                                <span className="text-xs text-gray-300 font-mono">
                                    {videoRef.current && !isNaN(videoRef.current.duration) ?
                                        `${Math.floor(videoRef.current.currentTime)} / ${Math.floor(videoRef.current.duration)}s` :
                                        '--:-- / --:--'}
                                </span>
                            </div>
                            <button
                                className="text-white hover:text-yellow-400 transition-colors"
                                onClick={toggleFullscreen}
                            >
                                <Maximize size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Bouton de lecture central */}
                    {!isPlaying && (
                        <button
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black/50 rounded-full flex items-center justify-center text-white hover:text-yellow-400 transition-colors"
                            onClick={togglePlay}
                        >
                            <Play size={32} className="ml-1" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VideoPlayer;