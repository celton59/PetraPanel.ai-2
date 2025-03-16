{pkgs}: {
  deps = [
    pkgs.awscli2
    pkgs.wget
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
