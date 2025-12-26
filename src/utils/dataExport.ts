export function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) {
        alert('Nenhum dado para exportar');
        return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Escapar vírgulas e aspas
                if (value === null || value === undefined) return '';
                const stringValue = String(value);
                return stringValue.includes(',') || stringValue.includes('"')
                    ? `"${stringValue.replace(/"/g, '""')}"`
                    : stringValue;
            }).join(',')
        )
    ].join('\n');

    downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

export function exportToJSON(data: any[], filename: string) {
    if (data.length === 0) {
        alert('Nenhum dado para exportar');
        return;
    }

    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${filename}.json`, 'application/json');
}

function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Função para importar CSV
export function importFromCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split('\n').filter(line => line.trim());

                if (lines.length < 2) {
                    reject(new Error('Arquivo CSV vazio ou inválido'));
                    return;
                }

                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const data = lines.slice(1).map(line => {
                    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    const obj: any = {};
                    headers.forEach((header, index) => {
                        obj[header] = values[index] || '';
                    });
                    return obj;
                });

                resolve(data);
            } catch (error) {
                reject(new Error('Erro ao processar arquivo CSV'));
            }
        };

        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsText(file);
    });
}

// Função para importar JSON
export function importFromJSON(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);

                if (!Array.isArray(data)) {
                    reject(new Error('Arquivo JSON deve conter um array'));
                    return;
                }

                resolve(data);
            } catch (error) {
                reject(new Error('Arquivo JSON inválido'));
            }
        };

        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsText(file);
    });
}
