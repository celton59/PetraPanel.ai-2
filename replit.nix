{pkgs}: {
  deps = [
    pkgs.sox
    pkgs.libsndfile
    pkgs.ffmpeg-full
    pkgs.xsimd
    pkgs.pkg-config
    pkgs.libxcrypt
    pkgs.ffmpeg
    pkgs.postgresql
  ];
}
