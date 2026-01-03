import type { CSSProperties } from 'hono/jsx';
import { useEffect, useRef, useState } from 'hono/jsx/dom';

// Utility functions
const isDataURL = (str: string) => {
  const regex =
    /^\s*data:([a-z]+\/[a-z]+(;[a-z-]+=[a-z-]+)?)?(;base64)?,[a-z0-9!$&',()*+;=\-._~:@/?%\s]*\s*$/i;
  return !!str.match(regex);
};

const loadImageURL = (imageURL: string, crossOrigin?: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    if (!isDataURL(imageURL) && crossOrigin) {
      image.crossOrigin = crossOrigin;
    }
    image.src = imageURL;
  });

const loadImageFile = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (!e?.target?.result) {
          throw new Error('No image data');
        }
        const image = loadImageURL(e.target.result as string);
        resolve(image);
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsDataURL(file);
  });

const isTouchDevice =
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

const isPassiveSupported = () => {
  let passiveSupported = false;
  try {
    const options = Object.defineProperty({}, 'passive', {
      get: () => {
        passiveSupported = true;
      },
    });

    const handler = () => {};
    window.addEventListener('test', handler, options);
    window.removeEventListener('test', handler, options);
  } catch {
    passiveSupported = false;
  }
  return passiveSupported;
};

const isFileAPISupported = typeof File !== 'undefined';

// Draws a rounded rectangle on a 2D context.
const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  borderRadius: number,
) => {
  if (borderRadius === 0) {
    context.rect(x, y, width, height);
  } else {
    const widthMinusRad = width - borderRadius;
    const heightMinusRad = height - borderRadius;
    context.translate(x, y);
    context.arc(
      borderRadius,
      borderRadius,
      borderRadius,
      Math.PI,
      Math.PI * 1.5,
    );
    context.lineTo(widthMinusRad, 0);
    context.arc(
      widthMinusRad,
      borderRadius,
      borderRadius,
      Math.PI * 1.5,
      Math.PI * 2,
    );
    context.lineTo(width, heightMinusRad);
    context.arc(
      widthMinusRad,
      heightMinusRad,
      borderRadius,
      Math.PI * 2,
      Math.PI * 0.5,
    );
    context.lineTo(borderRadius, height);
    context.arc(
      borderRadius,
      heightMinusRad,
      borderRadius,
      Math.PI * 0.5,
      Math.PI,
    );
    context.closePath();
    context.translate(-x, -y);
  }
};

// Draws a "Rule of Three" grid on the canvas.
const drawGrid = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  gridColor: string,
) => {
  context.fillStyle = gridColor;
  const thirdsX = width / 3;
  const thirdsY = height / 3;

  // vertical bars
  context.fillRect(x, y, 1, height);
  context.fillRect(thirdsX + x, y, 1, height);
  context.fillRect(thirdsX * 2 + x, y, 1, height);
  context.fillRect(thirdsX * 3 + x, y, 1, height);
  context.fillRect(thirdsX * 4 + x, y, 1, height);

  // horizontal bars
  context.fillRect(x, y, width, 1);
  context.fillRect(x, thirdsY + y, width, 1);
  context.fillRect(x, thirdsY * 2 + y, width, 1);
  context.fillRect(x, thirdsY * 3 + y, width, 1);
  context.fillRect(x, thirdsY * 4 + y, width, 1);
};

const defaultEmptyImage = {
  x: 0.5,
  y: 0.5,
};

interface ImageState {
  x: number;
  y: number;
  width?: number;
  height?: number;
  resource?: HTMLImageElement;
}

export interface AvatarEditorProps {
  width: number;
  height: number;
  style?: CSSProperties;
  image?: string | File;
  border?: number;
  position?: Position;
  scale?: number;
  rotate?: number;
  borderRadius?: number;
  crossOrigin?: '' | 'anonymous' | 'use-credentials';
  onLoadFailure?: () => void;
  onLoadSuccess?: (image: ImageState) => void;
  onImageReady?: () => void;
  onImageChange?: () => void;
  onMouseUp?: () => void;
  onMouseMove?: (e: TouchEvent | MouseEvent) => void;
  onPositionChange?: (position: Position) => void;
  color?: [number, number, number, number?];
  backgroundColor?: string;
  disableBoundaryChecks?: boolean;
  disableHiDPIScaling?: boolean;
  disableCanvasRotation?: boolean;
  borderColor?: [number, number, number, number?];
  showGrid?: boolean;
  gridColor?: string;
  className?: string;
  ref?:
    | {
        current:
          | (HTMLCanvasElement & {
              getImage: () => HTMLCanvasElement;
              getImageScaledToCanvas: () => HTMLCanvasElement;
              getCroppingRect: () => {
                x: number;
                y: number;
                width: number;
                height: number;
              };
            })
          | null;
      }
    | ((
        instance:
          | (HTMLCanvasElement & {
              getImage: () => HTMLCanvasElement;
              getImageScaledToCanvas: () => HTMLCanvasElement;
              getCroppingRect: () => {
                x: number;
                y: number;
                width: number;
                height: number;
              };
            })
          | null,
      ) => void);
}

export interface Position {
  x: number;
  y: number;
}

interface State {
  drag: boolean;
  mx?: number;
  my?: number;
  image: ImageState;
}

const defaultProps = {
  scale: 1,
  rotate: 0,
  border: 25,
  borderRadius: 0,
  width: 200,
  height: 200,
  color: [0, 0, 0, 0.5] as [number, number, number, number?],
  showGrid: false,
  gridColor: '#666',
  disableBoundaryChecks: false,
  disableHiDPIScaling: false,
  disableCanvasRotation: true,
} satisfies Partial<AvatarEditorProps>;

export const AvatarEditor = (props: AvatarEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { ref, ...restProps } = props;
  const pixelRatio =
    typeof window !== 'undefined' && window.devicePixelRatio
      ? window.devicePixelRatio
      : 1;

  const mergedProps = { ...defaultProps, ...restProps };

  const [state, setState] = useState<State>({
    drag: false,
    my: undefined,
    mx: undefined,
    image: defaultEmptyImage,
  });

  const getCanvas = (): HTMLCanvasElement => {
    if (!canvasRef.current) {
      throw new Error(
        'No canvas found, please report this to: https://github.com/mosch/react-avatar-editor/issues',
      );
    }
    return canvasRef.current;
  };

  const getContext = () => {
    const context = getCanvas().getContext('2d');
    if (!context) {
      throw new Error(
        'No context found, please report this to: https://github.com/mosch/react-avatar-editor/issues',
      );
    }
    return context;
  };

  const isVertical = () => {
    return !mergedProps.disableCanvasRotation && mergedProps.rotate % 180 !== 0;
  };

  const getBorders = (border = mergedProps.border) => {
    return Array.isArray(border) ? border : [border, border];
  };

  const getDimensions = () => {
    const { width, height, rotate, border } = mergedProps;

    const canvas = { width: 0, height: 0 };

    const [borderX, borderY] = getBorders(border);

    if (isVertical()) {
      canvas.width = height;
      canvas.height = width;
    } else {
      canvas.width = width;
      canvas.height = height;
    }

    canvas.width += borderX * 2;
    canvas.height += borderY * 2;

    return {
      canvas,
      rotate,
      width,
      height,
      border,
    };
  };

  const getXScale = () => {
    if (!state.image.width || !state.image.height)
      throw new Error('Image dimension is unknown.');

    const canvasAspect = mergedProps.width / mergedProps.height;
    const imageAspect = state.image.width / state.image.height;

    return Math.min(1, canvasAspect / imageAspect);
  };

  const getYScale = () => {
    if (!state.image.width || !state.image.height)
      throw new Error('Image dimension is unknown.');

    const canvasAspect = mergedProps.height / mergedProps.width;
    const imageAspect = state.image.height / state.image.width;

    return Math.min(1, canvasAspect / imageAspect);
  };

  const getCroppingRect = () => {
    const position = mergedProps.position || {
      x: state.image.x,
      y: state.image.y,
    };
    const width = (1 / mergedProps.scale) * getXScale();
    const height = (1 / mergedProps.scale) * getYScale();

    const croppingRect = {
      x: position.x - width / 2,
      y: position.y - height / 2,
      width,
      height,
    };

    let xMin = 0;
    let xMax = 1 - croppingRect.width;
    let yMin = 0;
    let yMax = 1 - croppingRect.height;

    const isLargerThanImage =
      mergedProps.disableBoundaryChecks || width > 1 || height > 1;

    if (isLargerThanImage) {
      xMin = -croppingRect.width;
      xMax = 1;
      yMin = -croppingRect.height;
      yMax = 1;
    }

    return {
      ...croppingRect,
      x: Math.max(xMin, Math.min(croppingRect.x, xMax)),
      y: Math.max(yMin, Math.min(croppingRect.y, yMax)),
    };
  };

  const getInitialSize = (width: number, height: number) => {
    let newHeight: number;
    let newWidth: number;

    const dimensions = getDimensions();
    const canvasRatio = dimensions.height / dimensions.width;
    const imageRatio = height / width;

    if (canvasRatio > imageRatio) {
      newHeight = dimensions.height;
      newWidth = Math.round(width * (newHeight / height));
    } else {
      newWidth = dimensions.width;
      newHeight = Math.round(height * (newWidth / width));
    }

    return {
      height: newHeight,
      width: newWidth,
    };
  };

  const loadImage = async (file: File | string) => {
    if (isFileAPISupported && file instanceof File) {
      try {
        const image = await loadImageFile(file);
        handleImageReady(image);
      } catch {
        mergedProps.onLoadFailure?.();
      }
    } else if (typeof file === 'string') {
      try {
        const image = await loadImageURL(file, mergedProps.crossOrigin);
        handleImageReady(image);
      } catch {
        mergedProps.onLoadFailure?.();
      }
    }
  };

  const handleImageReady = (image: HTMLImageElement) => {
    const imageState: ImageState = {
      ...getInitialSize(image.width, image.height),
      resource: image,
      x: 0.5,
      y: 0.5,
    };

    setState({ drag: false, image: imageState });
    mergedProps.onImageReady?.();
    mergedProps.onLoadSuccess?.(imageState);
  };

  const clearImage = () => {
    const canvas = getCanvas();
    const context = getContext();

    context.clearRect(0, 0, canvas.width, canvas.height);
    setState({ ...state, image: defaultEmptyImage });
  };

  const calculatePosition = (image = state.image, border?: number) => {
    const [borderX, borderY] = getBorders(border);

    if (!image.width || !image.height) {
      throw new Error('Image dimension is unknown.');
    }

    const croppingRect = getCroppingRect();

    const width = image.width * mergedProps.scale;
    const height = image.height * mergedProps.scale;

    let x = -croppingRect.x * width;
    let y = -croppingRect.y * height;

    if (isVertical()) {
      x += borderY;
      y += borderX;
    } else {
      x += borderX;
      y += borderY;
    }

    return { x, y, height, width };
  };

  const paintImage = (
    context: CanvasRenderingContext2D,
    image: ImageState,
    border: number,
    scaleFactor: number = mergedProps.disableHiDPIScaling ? 1 : pixelRatio,
  ) => {
    if (!image.resource) return;

    const position = calculatePosition(image, border);

    context.save();

    context.translate(context.canvas.width / 2, context.canvas.height / 2);
    context.rotate((mergedProps.rotate * Math.PI) / 180);
    context.translate(
      -(context.canvas.width / 2),
      -(context.canvas.height / 2),
    );

    if (isVertical()) {
      context.translate(
        (context.canvas.width - context.canvas.height) / 2,
        (context.canvas.height - context.canvas.width) / 2,
      );
    }

    context.scale(scaleFactor, scaleFactor);

    context.globalCompositeOperation = 'destination-over';
    context.drawImage(
      image.resource,
      position.x,
      position.y,
      position.width,
      position.height,
    );

    if (mergedProps.backgroundColor) {
      context.fillStyle = mergedProps.backgroundColor;
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    }

    context.restore();
  };

  const paint = (context: CanvasRenderingContext2D) => {
    context.save();
    const effectivePixelRatio = mergedProps.disableHiDPIScaling
      ? 1
      : pixelRatio;
    context.scale(effectivePixelRatio, effectivePixelRatio);
    context.translate(0, 0);
    context.fillStyle = `rgba(${mergedProps.color.slice(0, 4).join(',')})`;

    let borderRadius = mergedProps.borderRadius;
    const dimensions = getDimensions();
    const [borderSizeX, borderSizeY] = getBorders(dimensions.border);
    const height = dimensions.canvas.height;
    const width = dimensions.canvas.width;

    borderRadius = Math.max(borderRadius, 0);
    borderRadius = Math.min(
      borderRadius,
      width / 2 - borderSizeX,
      height / 2 - borderSizeY,
    );

    context.beginPath();
    drawRoundedRect(
      context,
      borderSizeX,
      borderSizeY,
      width - borderSizeX * 2,
      height - borderSizeY * 2,
      borderRadius,
    );
    context.rect(width, 0, -width, height);
    context.fill('evenodd');

    if (mergedProps.borderColor) {
      context.strokeStyle = `rgba(${mergedProps.borderColor.slice(0, 4).join(',')})`;
      context.lineWidth = 1;
      context.beginPath();
      drawRoundedRect(
        context,
        borderSizeX + 0.5,
        borderSizeY + 0.5,
        width - borderSizeX * 2 - 1,
        height - borderSizeY * 2 - 1,
        borderRadius,
      );
      context.stroke();
    }

    if (mergedProps.showGrid) {
      drawGrid(
        context,
        borderSizeX,
        borderSizeY,
        width - borderSizeX * 2,
        height - borderSizeY * 2,
        mergedProps.gridColor,
      );
    }
    context.restore();
  };

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setState({ ...state, drag: true, mx: undefined, my: undefined });
  };

  const handleTouchStart = (_e: TouchEvent) => {
    setState({ ...state, drag: true, mx: undefined, my: undefined });
  };

  const handleMouseUp = () => {
    if (state.drag) {
      setState({ ...state, drag: false });
      mergedProps.onMouseUp?.();
    }
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!state.drag) {
      return;
    }

    e.preventDefault();

    const mousePositionX =
      'targetTouches' in e
        ? e.targetTouches[0].pageX
        : (e as MouseEvent).clientX;
    const mousePositionY =
      'targetTouches' in e
        ? e.targetTouches[0].pageY
        : (e as MouseEvent).clientY;

    setState({ ...state, mx: mousePositionX, my: mousePositionY });

    let rotate = mergedProps.rotate;

    rotate %= 360;
    rotate = rotate < 0 ? rotate + 360 : rotate;

    if (
      state.mx !== undefined &&
      state.my !== undefined &&
      state.image.width &&
      state.image.height
    ) {
      const mx = state.mx - mousePositionX;
      const my = state.my - mousePositionY;

      const width = state.image.width * mergedProps.scale;
      const height = state.image.height * mergedProps.scale;

      let { x: lastX, y: lastY } = getCroppingRect();

      lastX *= width;
      lastY *= height;

      const toRadians = (degree: number) => degree * (Math.PI / 180);
      const cos = Math.cos(toRadians(rotate));
      const sin = Math.sin(toRadians(rotate));

      const x = lastX + mx * cos + my * sin;
      const y = lastY + -mx * sin + my * cos;

      const relativeWidth = (1 / mergedProps.scale) * getXScale();
      const relativeHeight = (1 / mergedProps.scale) * getYScale();

      const position = {
        x: x / width + relativeWidth / 2,
        y: y / height + relativeHeight / 2,
      };

      mergedProps.onPositionChange?.(position);

      setState({ ...state, image: { ...state.image, ...position } });
    }

    mergedProps.onMouseMove?.(e);
  };

  const getImage = (): HTMLCanvasElement => {
    const cropRect = getCroppingRect();
    const image = state.image;

    if (!image.resource) {
      throw new Error(
        'No image resource available, please report this to: https://github.com/mosch/react-avatar-editor/issues',
      );
    }

    cropRect.x *= image.resource.width;
    cropRect.y *= image.resource.height;
    cropRect.width *= image.resource.width;
    cropRect.height *= image.resource.height;

    const canvas = document.createElement('canvas');

    if (isVertical()) {
      canvas.width = cropRect.height;
      canvas.height = cropRect.width;
    } else {
      canvas.width = cropRect.width;
      canvas.height = cropRect.height;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error(
        'No context found, please report this to: https://github.com/mosch/react-avatar-editor/issues',
      );
    }

    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((mergedProps.rotate * Math.PI) / 180);
    context.translate(-(canvas.width / 2), -(canvas.height / 2));

    if (isVertical()) {
      context.translate(
        (canvas.width - canvas.height) / 2,
        (canvas.height - canvas.width) / 2,
      );
    }

    if (mergedProps.backgroundColor) {
      context.fillStyle = mergedProps.backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.drawImage(image.resource, -cropRect.x, -cropRect.y);

    return canvas;
  };

  const getImageScaledToCanvas = (): HTMLCanvasElement => {
    const { width, height } = getDimensions();

    const canvas = document.createElement('canvas');

    if (isVertical()) {
      canvas.width = height;
      canvas.height = width;
    } else {
      canvas.width = width;
      canvas.height = height;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('No context found');
    }

    paintImage(context, state.image, 0, 1);

    return canvas;
  };

  // Expose methods via ref
  useEffect(() => {
    if (canvasRef.current && ref) {
      const refValue = {
        ...canvasRef.current,
        getImage,
        getImageScaledToCanvas,
        getCroppingRect,
      };
      if (typeof ref === 'function') {
        ref(refValue);
      } else if (ref && 'current' in ref) {
        ref.current = refValue;
      }
    }
  }, [
    state.image,
    mergedProps.scale,
    mergedProps.rotate,
    mergedProps.position,
  ]);

  // Load image when props.image changes
  useEffect(() => {
    if (mergedProps.image) {
      loadImage(mergedProps.image);
    } else if (state.image !== defaultEmptyImage) {
      clearImage();
    }
  }, [mergedProps.image]);

  // Setup event listeners and paint
  useEffect(() => {
    const effectivePixelRatio = mergedProps.disableHiDPIScaling
      ? 1
      : pixelRatio;
    const context = getContext();
    const canvas = getCanvas();
    const dimensions = getDimensions();

    canvas.width = dimensions.canvas.width * effectivePixelRatio;
    canvas.height = dimensions.canvas.height * effectivePixelRatio;

    context.clearRect(0, 0, canvas.width, canvas.height);
    paint(context);
    paintImage(context, state.image, mergedProps.border);

    const options = isPassiveSupported() ? { passive: false } : false;
    document.addEventListener('mousemove', handleMouseMove, options);
    document.addEventListener('mouseup', handleMouseUp, options);

    if (isTouchDevice) {
      document.addEventListener('touchmove', handleMouseMove, options);
      document.addEventListener('touchend', handleMouseUp, options);
    }

    mergedProps.onImageChange?.();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, false);
      document.removeEventListener('mouseup', handleMouseUp, false);

      if (isTouchDevice) {
        document.removeEventListener('touchmove', handleMouseMove, false);
        document.removeEventListener('touchend', handleMouseUp, false);
      }
    };
  }, [
    mergedProps.width,
    mergedProps.height,
    mergedProps.position,
    mergedProps.scale,
    mergedProps.rotate,
    mergedProps.backgroundColor,
    state.image,
    state.mx,
    state.my,
  ]);

  const dimensions = getDimensions();

  const defaultStyle: CSSProperties = {
    width: dimensions.canvas.width,
    height: dimensions.canvas.height,
    cursor: state.drag ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  return (
    <canvas
      ref={canvasRef}
      width={
        dimensions.canvas.width *
        (mergedProps.disableHiDPIScaling ? 1 : pixelRatio)
      }
      height={
        dimensions.canvas.height *
        (mergedProps.disableHiDPIScaling ? 1 : pixelRatio)
      }
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{ ...defaultStyle, ...mergedProps.style }}
      className={mergedProps.className}
    />
  );
};

// Expose methods via ref
export interface AvatarEditorRef extends HTMLCanvasElement {
  getImage: () => HTMLCanvasElement;
  getImageScaledToCanvas: () => HTMLCanvasElement;
  getCroppingRect: () => {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export default AvatarEditor;
