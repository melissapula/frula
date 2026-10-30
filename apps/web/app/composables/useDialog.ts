export interface DialogOptions {
    title: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    isDestructive?: boolean
}

export interface PromptOptions extends DialogOptions {
    placeholder?: string
    initialValue?: string
}

export interface DialogRequest extends PromptOptions {
    kind: 'alert' | 'confirm' | 'prompt'
}

type DialogResult = boolean | string | null

// Dialogs only open from click handlers, so this never runs during SSR. It holds a
// function, which useState can't serialize.
let settle: ((result: DialogResult) => void) | null = null

/**
 * Promise-based replacements for window.alert, confirm and prompt, shown by the
 * AppDialog mounted in app.vue.
 */
export function useDialog() {
    const request = useState<DialogRequest | null>('app-dialog', () => null)

    function close(result: DialogResult) {
        settle?.(result)
        settle = null
        request.value = null
    }

    function open(next: DialogRequest): Promise<DialogResult> {
        settle?.(null)
        request.value = next
        return new Promise((resolve) => {
            settle = resolve
        })
    }

    async function alert(options: DialogOptions): Promise<void> {
        await open({ ...options, kind: 'alert' })
    }

    async function confirm(options: DialogOptions): Promise<boolean> {
        return (await open({ ...options, kind: 'confirm' })) === true
    }

    /** Resolves to the entered text, or null when cancelled. */
    async function prompt(options: PromptOptions): Promise<string | null> {
        const result = await open({ ...options, kind: 'prompt' })
        return typeof result === 'string' ? result : null
    }

    return { request, close, alert, confirm, prompt }
}
