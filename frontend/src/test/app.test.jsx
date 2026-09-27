import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import App from '../App.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

const { downloadAnimalsXlsxMock } = vi.hoisted(() => ({
  downloadAnimalsXlsxMock: vi.fn(),
}));

vi.mock('../utils/exportXlsx.js', () => ({
  downloadAnimalsXlsx: downloadAnimalsXlsxMock,
}));

const animals = [
  {
    id: 1,
    nombreComun: 'León',
    nombreCientifico: 'Panthera leo',
    clase: 'Mamífero',
    habitat: 'Sabana',
    dieta: 'Carnívoro',
    pesoPromedioKg: 190,
    esperanzaVidaAnios: 14,
    continente: 'África',
    enPeligroExtincion: true,
  },
  {
    id: 2,
    nombreComun: 'Águila',
    nombreCientifico: 'Aquila chrysaetos',
    clase: 'Ave',
    habitat: 'Montaña',
    dieta: 'Carnívoro',
    pesoPromedioKg: 6,
    esperanzaVidaAnios: 30,
    continente: 'Europa',
    enPeligroExtincion: false,
  },
];

function response(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(data),
  };
}

function renderApp(route = '/') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </AuthProvider>
  );
}

function HistoryBackButton() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(-1)}>Volver en historial</button>;
}

function renderAppWithHistory(initialEntries) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
        <HistoryBackButton />
      </MemoryRouter>
    </AuthProvider>
  );
}

function storeSession() {
  localStorage.setItem('token', 'valid-token');
  localStorage.setItem('user', JSON.stringify({ id: 1, email: 'demo@customswatch.test' }));
}

beforeEach(() => {
  vi.restoreAllMocks();
  downloadAnimalsXlsxMock.mockReset();
  downloadAnimalsXlsxMock.mockResolvedValue(true);
  vi.stubGlobal('fetch', vi.fn());
});

describe('sesión y autenticación', () => {
  test('redirige la ruta protegida al login cuando no hay sesión', async () => {
    renderApp('/animales');
    expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  test.each(['/login', '/signup'])(
    'redirige %s al buscador cuando la sesión ya está activa',
    async (route) => {
      storeSession();
      fetch.mockResolvedValue(response(animals));
      renderApp(route);

      expect(await screen.findByText('León')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /iniciar sesión|crear cuenta/i })).not.toBeInTheDocument();
    }
  );

  test('reemplaza el login en el historial después de autenticar', async () => {
    fetch
      .mockResolvedValueOnce(response({
        token: 'valid-token',
        user: { id: 1, email: 'demo@customswatch.test' },
      }))
      .mockResolvedValueOnce(response(animals));
    const user = userEvent.setup();
    renderAppWithHistory(['/login']);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'demo@customswatch.test');
    await user.type(screen.getByLabelText(/contraseña/i), 'segura123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    expect(await screen.findByText('León')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /volver en historial/i }));
    expect(screen.getByText('León')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /iniciar sesión/i })).not.toBeInTheDocument();
  });

  test('descarta una sesión local corrupta', async () => {
    localStorage.setItem('token', 'stale-token');
    localStorage.setItem('user', '{invalid-json');
    renderApp('/animales');

    expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('muestra el error genérico de un login fallido', async () => {
    fetch.mockResolvedValue(response({ message: 'Credenciales inválidas.' }, 401));
    const user = userEvent.setup();
    renderApp('/login');

    await user.type(screen.getByLabelText(/correo electrónico/i), 'demo@customswatch.test');
    await user.type(screen.getByLabelText(/contraseña/i), 'incorrecta');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas.');
  });

  test('limpia la sesión y vuelve al login ante un 401 del catálogo', async () => {
    storeSession();
    fetch.mockResolvedValue(response({ message: 'Token inválido o expirado.' }, 401));
    renderApp('/animales');

    expect(await screen.findByText(/tu sesión venció/i)).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('buscador protegido', () => {
  test('anuncia el estado de carga mientras espera el catálogo', async () => {
    storeSession();
    fetch.mockImplementation(() => new Promise(() => {}));
    renderApp('/animales');

    expect(await screen.findByRole('status')).toHaveTextContent(/consultando base de datos/i);
    expect(screen.getByRole('button', { name: /buscando/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /limpiar filtros/i })).toBeDisabled();
  });

  test('aplica las clases visuales de las acciones principales', async () => {
    storeSession();
    fetch.mockResolvedValue(response(animals));
    renderApp('/animales');
    await screen.findByText('León');

    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toHaveClass('btn-danger-soft');
    expect(screen.getByRole('button', { name: /exportar csv/i })).toHaveClass('btn-export-csv');
    expect(screen.getByRole('button', { name: /exportar excel/i })).toHaveClass('btn-export-excel');
  });

  test('muestra un error accesible cuando la red no está disponible', async () => {
    storeSession();
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    renderApp('/animales');

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo conectar con el servidor/i);
  });

  test('maneja una respuesta de error que no contiene JSON', async () => {
    storeSession();
    fetch.mockResolvedValue({
      ok: false,
      status: 502,
      text: async () => 'Servicio temporalmente no disponible',
    });
    renderApp('/animales');

    expect(await screen.findByRole('alert')).toHaveTextContent('Servicio temporalmente no disponible');
  });

  test('permite recorrer los filtros con el teclado en orden lógico', async () => {
    storeSession();
    fetch.mockResolvedValue(response(animals));
    const user = userEvent.setup();
    renderApp('/animales');
    await screen.findByText('León');

    screen.getByLabelText(/nombre común/i).focus();
    await user.tab();
    expect(screen.getByLabelText(/^clase$/i)).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText(/^dieta$/i)).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText(/^continente$/i)).toHaveFocus();
  });

  test('arma filtros, los limpia y valida rangos antes de llamar a la API', async () => {
    storeSession();
    fetch.mockResolvedValue(response(animals));
    const user = userEvent.setup();
    renderApp('/animales');

    await screen.findByText('León');
    const applyButton = screen.getByRole('button', { name: /aplicar filtros/i });
    const clearButton = screen.getByRole('button', { name: /limpiar filtros/i });
    expect(applyButton).toBeDisabled();
    expect(clearButton).toBeDisabled();

    await user.type(screen.getByLabelText(/nombre común/i), 'águila');
    await user.selectOptions(screen.getByLabelText(/^clase$/i), 'Ave');
    expect(applyButton).toBeEnabled();
    expect(clearButton).toBeEnabled();
    await user.click(applyButton);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch.mock.calls.at(-1)[0]).toContain('nombre=%C3%A1guila&clase=Ave');
    await waitFor(() => expect(applyButton).toBeDisabled());
    expect(clearButton).toBeEnabled();

    await user.clear(screen.getByLabelText(/peso mín/i));
    await user.type(screen.getByLabelText(/peso mín/i), '500');
    await user.clear(screen.getByLabelText(/peso máx/i));
    await user.type(screen.getByLabelText(/peso máx/i), '100');
    await user.click(applyButton);
    expect(await screen.findByRole('alert')).toHaveTextContent(/peso mínimo no puede ser mayor/i);
    expect(fetch).toHaveBeenCalledTimes(2);

    await user.click(clearButton);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    expect(fetch.mock.calls.at(-1)[0]).toBe('http://localhost:3000/api/animales');
    await waitFor(() => expect(applyButton).toBeDisabled());
    expect(clearButton).toBeDisabled();
  });

  test('conserva los cambios pendientes cuando falla una búsqueda', async () => {
    storeSession();
    fetch
      .mockResolvedValueOnce(response(animals))
      .mockResolvedValueOnce(response({ message: 'No se pudo completar la búsqueda.' }, 500));
    const user = userEvent.setup();
    renderApp('/animales');
    await screen.findByText('León');

    const applyButton = screen.getByRole('button', { name: /aplicar filtros/i });
    await user.type(screen.getByLabelText(/nombre común/i), 'león');
    await user.click(applyButton);

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo completar la búsqueda/i);
    expect(applyButton).toBeEnabled();
    expect(screen.getByRole('button', { name: /limpiar filtros/i })).toBeEnabled();
  });

  test('ordena columnas en ambas direcciones', async () => {
    storeSession();
    fetch.mockResolvedValue(response(animals));
    const user = userEvent.setup();
    renderApp('/animales');
    await screen.findByText('León');

    const names = () => screen.getAllByRole('row').slice(1).map((row) =>
      within(row).getByText(/^(León|Águila)$/).textContent
    );
    const speciesHeader = screen.getByRole('columnheader', { name: /especie/i });
    const weightHeader = screen.getByRole('columnheader', { name: /peso promedio/i });

    expect(speciesHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(speciesHeader).toHaveClass('is-sorted');
    expect(weightHeader.querySelector('.sort-pair')).toHaveTextContent('▲▼');

    await user.click(screen.getByRole('button', { name: /peso promedio/i }));
    expect(names()).toEqual(['Águila', 'León']);
    expect(weightHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(weightHeader).toHaveClass('is-sorted');
    expect(screen.getByRole('button', { name: /peso promedio: ordenar descendente/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /peso promedio/i }));
    expect(names()).toEqual(['León', 'Águila']);
    expect(weightHeader).toHaveAttribute('aria-sort', 'descending');
    expect(within(weightHeader).getByText('▼')).toBeInTheDocument();
  });

  test('asigna tonos estables por categoría y valor', async () => {
    storeSession();
    fetch.mockResolvedValue(response(animals));
    renderApp('/animales');
    await screen.findByText('León');

    const lionRow = screen.getByText('León').closest('tr');
    expect(within(lionRow).getByText('Mamífero')).toHaveClass('badge-toned', 'chip-class-mammal');
    expect(within(lionRow).getByText('Carnívoro')).toHaveClass('badge-toned', 'chip-diet-carnivore');
    expect(within(lionRow).getByText('África')).toHaveClass('badge-toned', 'chip-continent-africa');

    const eagleRow = screen.getByText('Águila').closest('tr');
    expect(within(eagleRow).getByText('Ave')).toHaveClass('chip-class-bird');
    expect(within(eagleRow).getByText('Europa')).toHaveClass('chip-continent-europe');
  });

  test('exporta a Excel el subconjunto visible en el orden actual', async () => {
    storeSession();
    fetch.mockResolvedValue(response(animals));
    const user = userEvent.setup();
    renderApp('/animales');
    await screen.findByText('León');

    await user.click(screen.getByRole('button', { name: /exportar excel/i }));

    await waitFor(() => expect(downloadAnimalsXlsxMock).toHaveBeenCalledOnce());
    expect(downloadAnimalsXlsxMock.mock.calls[0][0].map(({ nombreComun }) => nombreComun))
      .toEqual(['Águila', 'León']);
  });

  test('muestra un error accesible si falla la exportación Excel', async () => {
    storeSession();
    fetch.mockResolvedValue(response(animals));
    downloadAnimalsXlsxMock.mockRejectedValueOnce(new Error('falló la exportación'));
    const user = userEvent.setup();
    renderApp('/animales');
    await screen.findByText('León');

    await user.click(screen.getByRole('button', { name: /exportar excel/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo generar el archivo excel/i);
  });

  test('hace logout y elimina la sesión local', async () => {
    storeSession();
    fetch.mockResolvedValue(response(animals));
    const user = userEvent.setup();
    renderApp('/animales');
    await screen.findByText('León');

    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }));
    expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
