
export const getLabelFromOptions = (options, value) => {
    const found = options.find(opt => opt.value === value);
    return found ? found.label : value;
};
