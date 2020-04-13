import { DisplayMode, Engine, Input } from '../engine';

interface HTMLCanvasElement {
  gameRef?: Engine;
}

function isCanvasElement(el: any): el is HTMLCanvasElement {
  return el && el.nodeName === 'CANVAS';
}

let observer: MutationObserver;

/**
 * When Storybook unmounts story, make sure we cleanup the running game
 * to avoid weird state issues, or at least not to balloon memory.
 * 
 * @param records Change records
 */
const onDomMutated: MutationCallback = (records) => {
  if (records.length && records[0].removedNodes.length) {
    Array.from(records[0].removedNodes).forEach((node) => {
      if (isCanvasElement(node)) {
        console.debug('Stopping unmounted game', node.gameRef);
        node.gameRef?.stop();
        delete node.gameRef;
      }
    });
  }
};

/**
 * Helper to generate Storybook game engine instance
 * @param storyFn The storybook fn to pass the engine to
 */
export const withEngine = (storyFn: (game: Engine) => void) => {
  if (!observer) {
    observer = new MutationObserver(onDomMutated);
    observer.observe(document.getElementById('root'), { childList: true, subtree: true });
  }

  return () => {
    const canvas = document.createElement('canvas');
    const game = new Engine({ canvasElement: canvas, displayMode: DisplayMode.FullScreen, suppressPlayButton: true });

    game.input.keyboard.on('down', (keyDown?: Input.KeyEvent) => {
      if (keyDown.key === Input.Keys.D) {
        game.isDebug = !game.isDebug;
      }
    });

    storyFn(game);

    // store game ref
    (canvas as any).gameRef = game;

    return canvas;
  };
};
