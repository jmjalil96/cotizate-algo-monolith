import { Link } from "@tanstack/react-router";

interface ErrorBoundaryProps {
	error: Error;
	reset?: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md mx-auto text-center">
				<div className="bg-white rounded-lg shadow-lg p-8">
					<div className="mb-6">
						<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
							<svg
								className="h-6 w-6 text-red-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								role="img"
								aria-label="Error icon"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						</div>
						<h1 className="text-xl font-semibold text-gray-900 mb-2">Ocurrió un error</h1>
						<p className="text-gray-600">
							Ha ocurrido un error inesperado. Por favor intenta nuevamente.
						</p>
					</div>

					{/* Development error details */}
					{import.meta.env.DEV && (
						<div className="mb-6 p-4 bg-gray-100 rounded text-left">
							<h3 className="text-sm font-medium text-gray-700 mb-2">
								Error Details (Development Only):
							</h3>
							<pre className="text-xs text-gray-600 overflow-auto">
								{error.name}: {error.message}
								{error.stack && `\n\n${error.stack}`}
							</pre>
						</div>
					)}

					<div className="flex space-x-4">
						{reset && (
							<button
								type="button"
								className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
								onClick={reset}
							>
								Reintentar
							</button>
						)}
						<Link
							to="/"
							className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors text-center"
						>
							Volver al Inicio
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
