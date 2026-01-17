"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Play, Pause, RotateCcw } from "lucide-react"

declare global {
    interface Window {
        YT: any
        onYouTubeIframeAPIReady: () => void
    }
}

export function SalesVideoPlayer() {
    const VIDEO_ID = "F2lsLa_3o-M"
    const STORAGE_KEY = `vid_progress_${VIDEO_ID}`
    const IFRAME_ID = "sales-video-iframe"

    const playerRef = useRef<any>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const hideControlsTimer = useRef<NodeJS.Timeout | null>(null)

    const [isPlaying, setIsPlaying] = useState(false)
    const [showResumeOverlay, setShowResumeOverlay] = useState(false)
    const [showControls, setShowControls] = useState(true) // New: controls visibility
    const [isPlayerReady, setIsPlayerReady] = useState(false)

    // Auto-hide controls after 3 seconds while playing
    const resetHideTimer = useCallback(() => {
        if (hideControlsTimer.current) {
            clearTimeout(hideControlsTimer.current)
        }
        setShowControls(true)

        // Only auto-hide if video is playing
        if (isPlaying) {
            hideControlsTimer.current = setTimeout(() => {
                setShowControls(false)
            }, 3000)
        }
    }, [isPlaying])

    // When playing state changes, manage controls visibility
    useEffect(() => {
        if (isPlaying) {
            // Video started playing - start hide timer
            resetHideTimer()
        } else {
            // Video paused - always show controls
            if (hideControlsTimer.current) {
                clearTimeout(hideControlsTimer.current)
            }
            setShowControls(true)
        }

        return () => {
            if (hideControlsTimer.current) {
                clearTimeout(hideControlsTimer.current)
            }
        }
    }, [isPlaying, resetHideTimer])

    // Check saved time
    const checkSavedProgress = (p: any) => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const time = parseFloat(saved)
                const duration = p.getDuration()
                if (time > 5 && (duration > 0 ? time < (duration - 10) : true)) {
                    setShowResumeOverlay(true)
                    if (typeof p.pauseVideo === 'function') {
                        p.pauseVideo()
                    }
                }
            }
        } catch (e) {
            console.error("Error checking progress", e)
        }
    }

    // Initialize Player
    useEffect(() => {
        let internalPlayer: any = null;
        let apiPollInterval: NodeJS.Timeout | null = null;

        if (!window.YT) {
            const tag = document.createElement('script')
            tag.src = "https://www.youtube.com/iframe_api"
            const firstScriptTag = document.getElementsByTagName('script')[0]
            if (firstScriptTag && firstScriptTag.parentNode) {
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
            }
        }

        const initPlayer = () => {
            if (internalPlayer || playerRef.current) return

            if (wrapperRef.current && !document.getElementById(IFRAME_ID)) {
                const div = document.createElement('div');
                div.id = IFRAME_ID;
                div.className = "w-full h-full";
                wrapperRef.current.appendChild(div);
            }

            try {
                internalPlayer = new window.YT.Player(IFRAME_ID, {
                    videoId: VIDEO_ID,
                    width: '100%',
                    height: '100%',
                    playerVars: {
                        autoplay: 0,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        modestbranding: 1,
                        rel: 0,
                        showinfo: 0,
                        iv_load_policy: 3,
                        playsinline: 1,
                        origin: typeof window !== 'undefined' ? window.location.origin : undefined
                    },
                    events: {
                        onReady: (event: any) => {
                            playerRef.current = event.target
                            setIsPlayerReady(true)
                            checkSavedProgress(event.target)
                        },
                        onStateChange: (event: any) => {
                            const state = event.data
                            if (state === window.YT.PlayerState.PLAYING) {
                                setIsPlaying(true)
                            } else if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.ENDED) {
                                setIsPlaying(false)
                            }
                        },
                        onError: (e: any) => {
                            console.error("YouTube Player Error:", e.data)
                            setIsPlayerReady(true)
                        }
                    }
                })
            } catch (err) {
                console.error("Failed to init player", err)
            }
        }

        const checkAPI = () => {
            if (window.YT && window.YT.Player) {
                initPlayer()
                if (apiPollInterval) clearInterval(apiPollInterval)
            }
        }

        checkAPI()
        apiPollInterval = setInterval(checkAPI, 500)

        return () => {
            if (apiPollInterval) clearInterval(apiPollInterval)
            if (internalPlayer) {
                try { internalPlayer.destroy() } catch (e) { }
            }
            playerRef.current = null
            setIsPlayerReady(false)
        }

    }, [])

    // Save progress loop
    useEffect(() => {
        const interval = setInterval(() => {
            try {
                if (isPlaying && playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
                    const state = playerRef.current.getPlayerState()
                    if (state === 1) {
                        const currentTime = playerRef.current.getCurrentTime()
                        if (currentTime > 5) {
                            localStorage.setItem(STORAGE_KEY, currentTime.toString())
                        }
                    }
                }
            } catch (e) { }
        }, 5000)
        return () => clearInterval(interval)
    }, [isPlaying])

    const handleContainerClick = () => {
        // Don't handle container clicks when resume overlay is visible
        // (the overlay buttons have their own handlers)
        if (showResumeOverlay) return

        // When user clicks/taps the container
        if (isPlaying) {
            // If playing, show controls briefly then pause
            resetHideTimer()
            handlePause()
        } else {
            handlePlay()
        }
    }

    const handlePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation()

        if (!isPlayerReady) {
            return
        }

        if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
            playerRef.current.playVideo()
            setShowResumeOverlay(false)
        }
    }

    const handlePause = () => {
        if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
            playerRef.current.pauseVideo()
        }
    }

    const handleResume = (e: React.MouseEvent) => {
        e.stopPropagation()
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved && playerRef.current && typeof playerRef.current.seekTo === 'function') {
            playerRef.current.seekTo(parseFloat(saved), true)
        }
        handlePlay()
    }

    const handleRestart = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
            playerRef.current.seekTo(0, true)
        }
        handlePlay()
    }

    // Determine if controls overlay should be visible
    const shouldShowControlsOverlay = !showResumeOverlay && (!isPlaying || showControls)

    return (
        <div
            className={`relative w-full h-full aspect-video bg-slate-950 group overflow-hidden rounded-2xl shadow-2xl border border-slate-800 ${isPlayerReady ? 'cursor-pointer' : 'cursor-wait'}`}
            onClick={handleContainerClick}
            onMouseMove={isPlaying ? resetHideTimer : undefined}
            onTouchStart={isPlaying ? resetHideTimer : undefined}
        >
            <div ref={wrapperRef} className="absolute inset-0 pointer-events-none">
                <div id={IFRAME_ID} className="w-full h-full" />
            </div>

            <div className="absolute inset-0 z-10 bg-transparent" />

            {showResumeOverlay && (
                <div className="absolute inset-0 z-30 bg-gradient-to-br from-orange-400 to-orange-500 flex flex-col items-center justify-center text-center p-4 sm:p-6 animate-in fade-in duration-300">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-md w-full">
                        <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight">
                            Você já começou a assistir esse vídeo
                        </h3>
                        <div className="flex flex-row gap-2 sm:gap-4 w-full justify-center">
                            <button
                                onClick={handleResume}
                                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 bg-slate-900 text-orange-400 px-3 sm:px-5 py-2.5 sm:py-3 rounded-full font-semibold hover:bg-slate-800 transition-all text-xs sm:text-sm pointer-events-auto"
                            >
                                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                                <span className="hidden sm:inline">Continuar</span>
                                <span className="sm:hidden">Continuar</span>
                            </button>
                            <button
                                onClick={handleRestart}
                                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 bg-transparent border-2 border-slate-900 text-slate-900 px-3 sm:px-5 py-2.5 sm:py-3 rounded-full font-semibold hover:bg-slate-900 hover:text-orange-400 transition-all text-xs sm:text-sm pointer-events-auto"
                            >
                                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Do Início</span>
                                <span className="sm:hidden">Início</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls overlay with auto-hide on mobile */}
            {shouldShowControlsOverlay && (
                <div className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'bg-black/20' : 'bg-black/10 backdrop-blur-[2px]'}`}>
                    {!isPlaying ? (
                        <div
                            onClick={handlePlay}
                            className={`w-20 h-20 sm:w-24 sm:h-24 bg-orange-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer ${!isPlayerReady ? 'opacity-50 grayscale' : ''}`}
                        >
                            <Play className="w-10 h-10 text-white fill-white ml-2" />
                        </div>
                    ) : (
                        <div
                            onClick={(e) => { e.stopPropagation(); handlePause(); }}
                            className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-900/80 rounded-full flex items-center justify-center backdrop-blur-sm cursor-pointer border border-white/10"
                        >
                            <Pause className="w-10 h-10 text-white fill-white" />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
