/* eslint-disable @typescript-eslint/no-empty-function */
import type { ModalInstance, ModalOptions } from './types';
import { ModalInterface } from './interface';

const Default: ModalOptions = {
    placement: 'center',
    backdropClasses: 'bg-black bg-opacity-30 fixed inset-0 z-40',
    backdrop: 'dynamic',
    closable: true,
    onHide: () => {},
    onShow: () => {},
    onToggle: () => {},
};

const MinResizeWidth = 200;
const MinResizeHeight = 100;

class Modal implements ModalInterface {
    _targetEl: HTMLElement | null;
    _options: ModalOptions;
    _isHidden: boolean;
    _backdropEl: HTMLElement | null;
    _mouseUpOutsideEventListener: EventListenerOrEventListenerObject;
    _keydownEventListener: EventListenerOrEventListenerObject;
    _resizeTargetEl: HTMLElement | null;
    _modalWidthBeforeResize: number;
    _modalHeightBeforeResize: number;
    _resizeMouseDownX: number;
    _resizeMouseDownY: number;

    constructor(
        targetEl: HTMLElement | null = null,
        options: ModalOptions = Default
    ) {
        this._targetEl = targetEl;
        this._options = { ...Default, ...options };
        this._isHidden = true;
        this._backdropEl = null;
        this._init();
    }

    _init() {
        if (this._targetEl) {
            this._getPlacementClasses().map((c) => {
                this._targetEl.classList.add(c);
            });
        }

        const resizeEl = this._targetEl.querySelector(
            '[data-modal-resize-target]'
        );
        if (resizeEl) {
            const resizeTargetId = resizeEl.getAttribute(
                'data-modal-resize-target'
            );
            const resizeTargetEl = this._targetEl.querySelector<HTMLElement>(
                `#${resizeTargetId}`
            );
            if (resizeTargetEl) {
                this._resizeTargetEl = resizeTargetEl;
                resizeEl.addEventListener(
                    'mousedown',
                    this._onResizeMouseDown,
                    true
                );
            }
        }
    }

    _createBackdrop() {
        if (this._isHidden) {
            const backdropEl = document.createElement('div');
            backdropEl.setAttribute('modal-backdrop', '');
            backdropEl.classList.add(
                ...this._options.backdropClasses.split(' ')
            );
            document.querySelector('body').append(backdropEl);
            this._backdropEl = backdropEl;
        }
    }

    _destroyBackdropEl() {
        if (!this._isHidden) {
            document.querySelector('[modal-backdrop]').remove();
        }
    }

    _setupModalCloseEventListeners() {
        if (this._options.backdrop === 'dynamic') {
            this._mouseUpOutsideEventListener = (ev: MouseEvent) => {
                this._handleOutsideMouseUp(ev.target);
            };
            this._targetEl.addEventListener(
                'mouseup',
                this._mouseUpOutsideEventListener,
                true
            );
        }

        this._keydownEventListener = (ev: KeyboardEvent) => {
            if (ev.key === 'Escape') {
                this.hide();
            }
        };
        document.body.addEventListener(
            'keydown',
            this._keydownEventListener,
            true
        );
    }

    _removeModalCloseEventListeners() {
        if (this._options.backdrop === 'dynamic') {
            this._targetEl.removeEventListener(
                'click',
                this._mouseUpOutsideEventListener,
                true
            );
        }
        document.body.removeEventListener(
            'keydown',
            this._keydownEventListener,
            true
        );
    }

    _handleOutsideMouseUp(target: EventTarget) {
        if (
            target === this._targetEl ||
            (target === this._backdropEl && this.isVisible())
        ) {
            this.hide();
        }
    }

    _getPlacementClasses() {
        switch (this._options.placement) {
            // top
            case 'top-left':
                return ['justify-start', 'items-start'];
            case 'top-center':
                return ['justify-center', 'items-start'];
            case 'top-right':
                return ['justify-end', 'items-start'];

            // center
            case 'center-left':
                return ['justify-start', 'items-center'];
            case 'center':
                return ['justify-center', 'items-center'];
            case 'center-right':
                return ['justify-end', 'items-center'];

            // bottom
            case 'bottom-left':
                return ['justify-start', 'items-end'];
            case 'bottom-center':
                return ['justify-center', 'items-end'];
            case 'bottom-right':
                return ['justify-end', 'items-end'];

            default:
                return ['justify-center', 'items-center'];
        }
    }

    __onResizeMouseDown(e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();

        this._modalWidthBeforeResize = this._resizeTargetEl.clientWidth;
        this._modalHeightBeforeResize = this._resizeTargetEl.clientHeight;
        this._resizeMouseDownX = e.pageX;
        this._resizeMouseDownY = e.pageY;

        document.addEventListener('mousemove', this._onResizeMouseMove, true);
        document.addEventListener('mouseup', this._onResizeMouseUp, true);
    }

    _onResizeMouseDown = this.__onResizeMouseDown.bind(this);

    __onResizeMouseMove(e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();

        const deltaX = e.pageX - this._resizeMouseDownX;
        const deltaY = e.pageY - this._resizeMouseDownY;
        let newWidth = this._modalWidthBeforeResize + deltaX;
        let newHeight = this._modalHeightBeforeResize + deltaY;
        newWidth = Math.max(MinResizeWidth, newWidth);
        newHeight = Math.max(MinResizeHeight, newHeight);

        this._resizeTargetEl.style.width = `${newWidth}px`;
        this._resizeTargetEl.style.height = `${newHeight}px`;
        this._resizeTargetEl.style.maxWidth = '100%';
    }

    _onResizeMouseMove = this.__onResizeMouseMove.bind(this);

    __onResizeMouseUp(e: MouseEvent) {
        e.stopPropagation();

        document.removeEventListener(
            'mousemove',
            this._onResizeMouseMove,
            true
        );
        document.removeEventListener('mouseup', this._onResizeMouseUp, true);
    }

    _onResizeMouseUp = this.__onResizeMouseUp.bind(this);

    toggle() {
        if (this._isHidden) {
            this.show();
        } else {
            this.hide();
        }

        // callback function
        this._options.onToggle(this);
    }

    show() {
        if (this.isHidden) {
            this._targetEl.classList.add('flex');
            this._targetEl.classList.remove('hidden');
            this._targetEl.setAttribute('aria-modal', 'true');
            this._targetEl.setAttribute('role', 'dialog');
            this._targetEl.removeAttribute('aria-hidden');
            this._createBackdrop();
            this._isHidden = false;

            // prevent body scroll
            document.body.classList.add('overflow-hidden');

            // Add keyboard event listener to the document
            if (this._options.closable) {
                this._setupModalCloseEventListeners();
            }

            // callback function
            this._options.onShow(this);
        }
    }

    hide() {
        if (this.isVisible) {
            this._targetEl.classList.add('hidden');
            this._targetEl.classList.remove('flex');
            this._targetEl.setAttribute('aria-hidden', 'true');
            this._targetEl.removeAttribute('aria-modal');
            this._targetEl.removeAttribute('role');
            this._destroyBackdropEl();
            this._isHidden = true;

            // re-apply body scroll
            document.body.classList.remove('overflow-hidden');

            if (this._options.closable) {
                this._removeModalCloseEventListeners();
            }

            // callback function
            this._options.onHide(this);
        }
    }

    isVisible() {
        return !this._isHidden;
    }

    isHidden() {
        return this._isHidden;
    }
}

const getModalInstance = (id: string, instances: ModalInstance[]) => {
    if (instances.some((modalInstance) => modalInstance.id === id)) {
        return instances.find((modalInstance) => modalInstance.id === id);
    }
    return null;
};

export function initModals() {
    const modalInstances = [] as ModalInstance[];

    // initiate modal based on data-modal-target
    document.querySelectorAll('[data-modal-target]').forEach(($triggerEl) => {
        const modalId = $triggerEl.getAttribute('data-modal-target');
        const $modalEl = document.getElementById(modalId);

        if ($modalEl) {
            const placement = $modalEl.getAttribute('data-modal-placement');
            const backdrop = $modalEl.getAttribute('data-modal-backdrop');

            if (!getModalInstance(modalId, modalInstances)) {
                modalInstances.push({
                    id: modalId,
                    object: new Modal(
                        $modalEl as HTMLElement,
                        {
                            placement: placement
                                ? placement
                                : Default.placement,
                            backdrop: backdrop ? backdrop : Default.backdrop,
                        } as ModalOptions
                    ),
                });
            }
        } else {
            console.error(
                `Modal with id ${modalId} does not exist. Are you sure that the data-modal-target attribute points to the correct modal id?.`
            );
        }
    });

    // support pre v1.6.0 data-modal-toggle initialization
    document.querySelectorAll('[data-modal-toggle]').forEach(($triggerEl) => {
        const modalId = $triggerEl.getAttribute('data-modal-toggle');
        const $modalEl = document.getElementById(modalId);

        if ($modalEl) {
            const placement = $modalEl.getAttribute('data-modal-placement');
            const backdrop = $modalEl.getAttribute('data-modal-backdrop');

            let modal: ModalInstance = getModalInstance(
                modalId,
                modalInstances
            );
            if (!modal) {
                modal = {
                    id: modalId,
                    object: new Modal(
                        $modalEl as HTMLElement,
                        {
                            placement: placement
                                ? placement
                                : Default.placement,
                            backdrop: backdrop ? backdrop : Default.backdrop,
                        } as ModalOptions
                    ),
                };
                modalInstances.push(modal);
            }

            $triggerEl.addEventListener('click', () => {
                modal.object.toggle();
            });
        } else {
            console.error(
                `Modal with id ${modalId} does not exist. Are you sure that the data-modal-toggle attribute points to the correct modal id?`
            );
        }
    });

    // show modal on click if exists based on id
    document.querySelectorAll('[data-modal-show]').forEach(($triggerEl) => {
        const modalId = $triggerEl.getAttribute('data-modal-show');
        const $modalEl = document.getElementById(modalId);

        if ($modalEl) {
            const modal: ModalInstance = getModalInstance(
                modalId,
                modalInstances
            );
            if (modal) {
                $triggerEl.addEventListener('click', () => {
                    if (modal.object.isHidden) {
                        modal.object.show();
                    }
                });
            } else {
                console.error(
                    `Modal with id ${modalId} has not been initialized. Please initialize it using the data-modal-target attribute.`
                );
            }
        } else {
            console.error(
                `Modal with id ${modalId} does not exist. Are you sure that the data-modal-show attribute points to the correct modal id?`
            );
        }
    });

    // hide modal on click if exists based on id
    document.querySelectorAll('[data-modal-hide]').forEach(($triggerEl) => {
        const modalId = $triggerEl.getAttribute('data-modal-hide');
        const $modalEl = document.getElementById(modalId);

        if ($modalEl) {
            const modal: ModalInstance = getModalInstance(
                modalId,
                modalInstances
            );

            if (modal) {
                $triggerEl.addEventListener('click', () => {
                    if (modal.object.isVisible) {
                        modal.object.hide();
                    }
                });
            } else {
                console.error(
                    `Modal with id ${modalId} has not been initialized. Please initialize it using the data-modal-target attribute.`
                );
            }
        } else {
            console.error(
                `Modal with id ${modalId} does not exist. Are you sure that the data-modal-hide attribute points to the correct modal id?`
            );
        }
    });
}

if (typeof window !== 'undefined') {
    window.Modal = Modal;
    window.initModals = initModals;
}

export default Modal;
