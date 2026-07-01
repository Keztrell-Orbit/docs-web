export function DocumentLogo() {
  return (
    <div className="relative w-16 h-16 mb-8 select-none group" id="document-logo-sphere">
      {/* Photorealistic elongated flat shadow cast on the paper page */}
      <div
        className="absolute bottom-[-1px] right-[-10px] w-[56px] h-[14px] rounded-full bg-black/40 blur-[2px]"
        style={{
          transform: "rotate(-10deg) skewX(-32deg)",
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 65%, rgba(0,0,0,0) 100%)"
        }}
      />
      {/* Gradient 3D glossy sphere */}
      <div
        className="absolute inset-0 rounded-full transform transition-transform duration-500 group-hover:scale-105"
        style={{
          background: "radial-gradient(circle at 32% 32%, #60A5FA 0%, #2563EB 35%, #1D4ED8 70%, #1E3A8A 100%)",
          boxShadow: "inset -6px -6px 14px rgba(0, 0, 0, 0.75), inset 6px 6px 12px rgba(255, 255, 255, 0.45)"
        }}
      >
        {/* Soft glossy reflection highlight */}
        <div
          className="absolute top-[10%] left-[10%] w-[16px] h-[16px] rounded-full"
          style={{
            background: "radial-gradient(circle at center, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 80%)"
          }}
        />
      </div>
    </div>
  );
}

