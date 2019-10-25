import hyper from 'hyperhtml';
import * as Utils from '@shared/utils';
import { interpolateClassName } from '../../utils';

interface TextInputOptions {
  initialValue?: string;
  maxLength?: number;
  attributes?: string;
  style?: string;
  onInput?: (e: Event) => void;
}

function parseOptions(options?: TextInputOptions) {
  if (!options) {
    return {};
  }
  const opts: TextInputOptions = {
    initialValue: Utils.objectGet(options, 'initialValue', ''),
    maxLength: Utils.objectGet(options, 'maxLength', null),
    attributes: Utils.objectGet(options, 'attributes', ''),
    onInput: Utils.objectGet(options, 'onInput', null),
    style: Utils.objectGet(options, 'style', ''),
  };
  return opts;
}

export default class TextInput extends hyper.Component {

  private label: string;
  private inputElement: HTMLInputElement;
  private errorElement: HTMLParagraphElement;
  private errorContainer: HTMLDivElement;
  private lastError: string;
  private hasError: boolean;
  readonly options: TextInputOptions;

  constructor(label: string, options?: TextInputOptions) {
    super();
    this.label = label;
    this.hasError = false;

    const opts = parseOptions(options);

    this.inputElement = hyper.wire()`<input
        id="${interpolateClassName(label)}"
        accept-charset="UTF-8"
        type="text"
        value="${opts.initialValue}"
        maxlength="${opts.maxLength}"
        style="${opts.style}"
        oninput=${opts.onInput}
        />`;

    this.errorElement = document.createElement('p');
    this.errorElement.className = 'input-error';
    this.options = opts;

    this.errorContainer = hyper.wire(this)`
    <div class="input-error-container">
      ${this.errorElement}
    </div>
    `;
  }

  setValue(value: string, resetValidation: boolean = true) {
    this.inputElement.value = value;
    if (resetValidation) {
      if (this.hasError) {
        this.errorElement.classList.remove('show');
        this.hasError = false;
      }

      this.inputElement.setCustomValidity('');
    }
  }

  setError(errorValue: string) {
    const error = Utils.getValue(errorValue, '');
    if (error.length > 0) {
      if (!this.hasError) {
        this.hasError = true;
        this.errorElement.classList.add('show');
      }
      this.lastError = error;
    } else {
      if (this.hasError) {
        this.errorElement.classList.remove('show');
        this.hasError = false;
      }
    }
    this.errorElement.textContent = this.lastError;
    this.inputElement.setCustomValidity(errorValue);
  }

  reset() {
    this.setError(null);
    this.inputElement.value = this.options.initialValue;
  }

  render() {
    return this.html`
    <div class="input-text-box">
      <label class="input-label">${this.label}</label>
      <div class="input-box">
        ${this.inputElement}
      </div>
        ${this.errorContainer}
    </div>
    `;
  }

}