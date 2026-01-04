const Toast = {
    init() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.position = 'fixed';
        this.container.style.top = '20px';
        this.container.style.right = '20px';
        this.container.style.zIndex = '10000';
        document.body.appendChild(this.container);
    },

    show(message, type = 'info') {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerText = message;
        
        // Styles
        toast.style.padding = '12px 24px';
        toast.style.marginBottom = '10px';
        toast.style.borderRadius = '8px';
        toast.style.color = '#fff';
        toast.style.fontSize = '0.9rem';
        toast.style.fontWeight = '600';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'all 0.3s ease';
        toast.style.minWidth = '250px';

        if (type === 'success') toast.style.backgroundColor = '#10b981'; // Green
        else if (type === 'error') toast.style.backgroundColor = '#ef4444'; // Red
        else if (type === 'info') toast.style.backgroundColor = '#3b82f6'; // Blue
        else toast.style.backgroundColor = '#374151'; // Gray

        this.container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Remove after 3s
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
};

// Auto init
document.addEventListener('DOMContentLoaded', () => Toast.init());
