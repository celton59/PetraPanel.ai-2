{pkgs}: {
  deps = [
    pkgs.nodePackages.prisma
    pkgs.wget
    pkgs.sox
    pkgs.libsndfile
    pkgs.ffmpeg-full
    pkgs.xsimd
    pkgs.pkg-config
    pkgs.libxcrypt
    pkgs.ffmpeg
    pkgs.postgresql
    pkgs.openssl
  ];
}
