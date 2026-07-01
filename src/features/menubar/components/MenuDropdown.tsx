interface MenuItem {
  label: string;
  action: () => void;
}

interface MenuDropdownProps {
  items: MenuItem[];
  coords: { top: number; left: number };
  onClose: () => void;
  menuKey: string;
}

export function MenuDropdown({ items, coords, onClose, menuKey }: MenuDropdownProps) {
  return (
    <div
      className="fixed w-56 bg-white border border-[#E1DFD5] rounded-lg shadow-xl py-1.5 z-50 animate-fade-in"
      style={{ top: `${coords.top + 4}px`, left: `${coords.left}px` }}
      id={`menu-dropdown-${menuKey}`}
    >
      {items.length > 0 ? (
        items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              item.action();
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-xs font-sans text-stone-700 hover:bg-stone-200/50 hover:text-stone-900 flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>{item.label}</span>
          </button>
        ))
      ) : (
        <div className="px-4 py-2 text-xs font-sans text-stone-400 italic">No actions defined</div>
      )}
    </div>
  );
}
