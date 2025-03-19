import bcrypt from 'bcrypt';

export const hashPassword = async (password: string): Promise<string> => {
    try {
        const salt = await bcrypt.genSalt(12); // Usar un `cost` de 12 para mayor seguridad
        return bcrypt.hash(password, salt);
    } catch (error) {
        throw new Error('Error al encriptar la contraseña');
    }
};

export const checkPassword = async (enteredPassword: string, hash: string): Promise<boolean> => {
    try {
        return bcrypt.compare(enteredPassword, hash);
    } catch (error) {
        throw new Error('Error al verificar la contraseña');
    }
};
