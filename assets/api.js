const SUPABASE_URL = 'https://dqkxcahgwalpzgrdqbmc.supabase.co';
const SUPABASE_ANON = 'sb_publishable__kwdZPx4sNO98utCarQ0fQ_gxGVFChd';

async function submitToSupabase(type, fields) {
	const res = await fetch(`${SUPABASE_URL}/rest/v1/form_submissions`, {
		method: 'POST',
		headers: {
			'apikey': SUPABASE_ANON,
			'Authorization': `Bearer ${SUPABASE_ANON}`,
			'Content-Type': 'application/json',
			'Prefer': 'return=minimal'
		},
		body: JSON.stringify({
			type,
			fields,
			done: false
		})
	});

	if (!res.ok) {
		const msg = await res.text().catch(() => 'Unknown error');
		throw new Error(msg || `HTTP ${res.status}`);
	}

	return true;
}