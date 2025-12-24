import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { HandTracker } from './components/HandTracker';
import { CelestialScene } from './components/CelestialScene';
import { CameraRig } from './components/CameraRig';
import { MemoryGallery } from './components/MemoryGallery';
import { DenseStarField } from './components/DenseStarField';

// === 1. CẤU HÌNH NHẠC ===

// A. Nhạc nền trang bìa (Intro) - Chỉ 1 bài
const INTRO_SONG = '/music/intro.mp3'; 

// B. Playlist khi vào xem cây thông
const MAIN_PLAYLIST = [
  '/music/song1.mp3',
  '/music/song2.mp3',
  '/music/song3.mp3',
  '/music/song4.mp3',

];

// === 2. CẤU HÌNH DỮ LIỆU KỶ NIỆM ===
const MEMORIES = [
  { type: 'video', url: '/videos/2.mp4' }, 
  { type: 'image', url: '/photos/17.jpg' },
  { type: 'image', url: '/photos/18.jpg' },
  { type: 'image', url: '/photos/5.jpg' },
  { type: 'image', url: '/photos/11.jpg' },
  { type: 'image', url: '/photos/15.jpg' },
  { type: 'image', url: '/photos/12.jpg' },
  { type: 'image', url: '/photos/4.jpg' },
  { type: 'image', url: '/photos/16.jpg' },
  { type: 'image', url: '/photos/1.jpg' },
  { type: 'image', url: '/photos/13.jpg' },
  { type: 'image', url: '/photos/7.jpg' },
  { type: 'video', url: '/videos/1.mp4' },
  { type: 'image', url: '/photos/8.jpg' },
  { type: 'image', url: '/photos/6.jpg' },
  { type: 'image', url: '/photos/9.jpg' },
  { type: 'image', url: '/photos/10.jpg' },
  { type: 'image', url: '/photos/3.jpg' },
  { type: 'image', url: '/photos/14.jpg' },
];

export default function App() {
  const [handData, setHandData] = useState({ 
    pos: { x: 0, y: 0 }, 
    state: 'FIST', 
    hasHand: false 
  });

  // QUẢN LÝ TRẠNG THÁI ỨNG DỤNG
  // 0: Chưa tương tác (Màn hình đen, chờ click để bật tiếng)
  // 1: Đang ở Bìa (Phát nhạc Intro)
  // 2: Đang xem Cây thông (Phát Playlist)
  const [stage, setStage] = useState(0);

  // Refs quản lý Audio
  const introAudioRef = useRef(null);
  const playlistAudioRef = useRef(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  // --- LOGIC GIAI ĐOẠN 1: BẬT NHẠC INTRO ---
  const handleEnableAudio = () => {
    // Chuyển sang giai đoạn Bìa
    setStage(1);
    
    // Phát nhạc Intro
    const intro = new Audio(INTRO_SONG);
    intro.loop = true;
    intro.volume = 0.6;
    intro.play().catch(e => console.error("Lỗi Intro:", e));
    introAudioRef.current = intro;
  };

  // --- LOGIC GIAI ĐOẠN 2: VÀO CÂY THÔNG & PHÁT PLAYLIST ---
  const handleEnterWorld = () => {
    // Chuyển sang giai đoạn Chính
    setStage(2);

    // 1. Tắt nhạc Intro
    if (introAudioRef.current) {
        introAudioRef.current.pause();
        introAudioRef.current = null;
    }

    // 2. Kích hoạt Playlist
    playNextSong(0); 
  };

  // Hàm phát nhạc Playlist
  const playNextSong = (index) => {
    // Hủy bài cũ
    if (playlistAudioRef.current) {
        playlistAudioRef.current.pause();
    }

    const songUrl = MAIN_PLAYLIST[index];
    const audio = new Audio(songUrl);
    audio.volume = 0.5;

    // Tự động chuyển bài khi hết
    audio.onended = () => {
        const nextIndex = (index + 1) % MAIN_PLAYLIST.length;
        setCurrentSongIndex(nextIndex);
        playNextSong(nextIndex); // Đệ quy gọi bài tiếp theo
    };

    audio.play().catch(e => console.error("Lỗi Playlist:", e));
    playlistAudioRef.current = audio;
  };

  // Cleanup khi tắt web
  useEffect(() => {
    return () => {
      if (introAudioRef.current) introAudioRef.current.pause();
      if (playlistAudioRef.current) playlistAudioRef.current.pause();
    };
  }, []);

  return (
    <div className="w-full h-screen bg-[#00050a] relative overflow-hidden font-serif">

      {/* === UI GIAI ĐOẠN 0: MÀN HÌNH CHỜ TƯƠNG TÁC === */}
      {stage === 0 && (
        <div 
          onClick={handleEnableAudio}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black cursor-pointer"
        >
          <div className="text-yellow-500 animate-pulse text-center">
            <p className="text-6xl mb-6">🎄</p>
            <p className="tracking-[0.3em] uppercase text-sm font-light">Chạm bất kỳ đâu để bắt đầu</p>
          </div>
        </div>
      )}

      {/* === UI GIAI ĐOẠN 1: TRANG BÌA (COVER) - CÓ NHẠC INTRO === */}
      {/* === UI GIAI ĐOẠN 1: TRANG BÌA (COVER) === */}
      {stage === 1 && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-yellow-500 transition-opacity duration-1000">
          <h1 className="text-3xl md:text-5xl tracking-widest mb-8 animate-pulse text-center font-light drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
            CHRISTMAS MEMORIES
          </h1>
          
          <button 
            onClick={handleEnterWorld}
            // Thêm min-w để nút không bị giật kích thước quá nhiều khi đổi chữ
            className="group relative px-8 py-3 bg-transparent overflow-hidden rounded-full border border-yellow-500/50 hover:border-yellow-500 transition-all duration-300 min-w-[200px]"
          >
            {/* Container chứa chữ */}
            <span className="relative z-10 text-sm group-hover:text-black transition-colors duration-300">
              
              {/* 1. Dòng chữ mặc định (Hiện khi chưa hover, Ẩn khi hover) */}
              <span className="inline-block tracking-[0.3em] uppercase group-hover:hidden">
                Chạm để mở quà 🎁
              </span>

              {/* 2. Dòng chữ khi Hover (Ẩn mặc định, Hiện khi hover) */}
              {/* Bỏ uppercase và giảm tracking một chút để câu dài hiển thị đẹp hơn */}
              <span className="hidden group-hover:inline-block font-bold tracking-wider">
                Đây là web tương tác 3D chị nghịch thử nha hihi
              </span>

            </span>

            {/* Hiệu ứng nền vàng trượt vào */}
            <div className="absolute inset-0 bg-yellow-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </button>
          
          <p className="mt-6 text-white/60 text-xs italic tracking-wider animate-bounce text-center px-4">
            *Bật âm thanh thiết bị, cho phép Camera và tìm một góc tối để cảm nhận nghennnnn !!!!
          </p>
        </div>
      )}

      {/* === GIAI ĐOẠN 2: SÂN KHẤU 3D (CHỈ HIỆN KHI ĐÃ VÀO TRONG) === */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${stage === 2 ? 'opacity-100' : 'opacity-0'}`}>
          {/* Lưu ý: Camera Z=60 để thấy trái tim */}
          <Canvas camera={{ position: [0, 0, 60], fov: 45 }} dpr={[1, 2]}>
            <DenseStarField handData={handData} />
            <CelestialScene handData={handData} />
            <MemoryGallery handData={handData} memories={MEMORIES} />
            <CameraRig handData={handData} />
          </Canvas>
      </div>

      {/* === UI GIAI ĐOẠN 2: GIAO DIỆN CHÍNH === */}
      {stage === 2 && (
        <>
          <div className="absolute top-10 w-full text-center z-20 pointer-events-none select-none animate-[fadeInDown_1s_ease-out]">
            <h1 className="text-4xl md:text-6xl font-light text-yellow-500 tracking-[0.2em] opacity-90 drop-shadow-[0_0_25px_rgba(255,215,0,0.5)]">
              MERRY CHRISTMAS
            </h1>
            <p className="text-yellow-100/40 mt-4 text-[10px] md:text-xs tracking-[0.3em] uppercase animate-pulse">
              {handData.state === 'FIST' ? 'Gathering stardust...' : 'Magic is unfolding'}
            </p>
          </div>

          <div className="absolute bottom-8 left-8 z-30 w-32 h-24 md:w-48 md:h-36 rounded-xl overflow-hidden border border-yellow-500/30 shadow-[0_0_20px_rgba(255,215,0,0.1)] opacity-60 hover:opacity-100 transition-all duration-500 animate-[fadeInUp_1s_ease-out]">
            <HandTracker onUpdate={setHandData} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="absolute bottom-10 right-10 text-right z-20 select-none pointer-events-none animate-[fadeInUp_1s_ease-out]">
            {/* Dòng Credit: Cho to lên xíu (text-xs) */}
            <p className="text-yellow-600/70 text-xs tracking-[0.3em] uppercase">
              Code by kisnxc
            </p>
            
            {/* Dòng Tặng chị Ngân: TO, SÁNG và LUNG LINH */}
            <p className="text-white/90 text-xl md:text-3xl mt-2 italic font-light tracking-widest drop-shadow-[0_0_10px_rgba(255,100,100,0.5)]">
              Tặng chị Cẩm Ngân xinh đẹp ❤️
            </p>
            
            {/* Dòng bài hát: To lên xíu cho dễ đọc */}
            <p className="text-white/40 text-[10px] md:text-xs mt-2 tracking-wider uppercase">
               Playing: Song #{currentSongIndex + 1}
            </p>
          </div>
        </>
      )}
      
    </div>
  );
}