declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
    useWorker?: boolean;
    resize?: boolean;
  }

  interface CreateTypes {
    (options?: ConfettiOptions): void;
    reset: () => void;
  }

  interface ConfettiFunction {
    (options?: ConfettiOptions): Promise<null>;
    create: (canvas: HTMLCanvasElement, options?: { resize?: boolean; useWorker?: boolean }) => CreateTypes;
    reset: () => void;
  }

  const confetti: ConfettiFunction;
  export default confetti;
}