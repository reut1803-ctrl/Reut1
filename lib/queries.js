// שכבת גישה למסד הנתונים (Supabase) - כל הקריאות שהאפליקציה צריכה.

export async function fetchCandidates(supabase, gender) {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("gender", gender)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapCandidate);
}

export async function fetchInternalNote(supabase, candidateId) {
  const { data } = await supabase
    .from("candidate_internal_notes")
    .select("*")
    .eq("candidate_id", candidateId)
    .maybeSingle();
  return data;
}

function mapCandidate(row) {
  return {
    id: row.id,
    gender: row.gender,
    name: row.name,
    age: row.age,
    height: row.height,
    region: row.region,
    religiousLevel: row.religious_level,
    study: row.study,
    smoking: row.smoking,
    traits: row.traits ?? [],
    about: row.about,
    image: row.image_url,
    isNew: row.is_new,
    isPrevious: row.is_previous,
  };
}

export async function fetchFavoriteIds(supabase, userId) {
  const { data, error } = await supabase.from("favorites").select("candidate_id").eq("user_id", userId);
  if (error) throw error;
  return data.map((r) => r.candidate_id);
}

export async function toggleFavorite(supabase, userId, candidateId, isFavorite) {
  if (isFavorite) {
    await supabase.from("favorites").delete().eq("user_id", userId).eq("candidate_id", candidateId);
  } else {
    await supabase.from("favorites").insert({ user_id: userId, candidate_id: candidateId });
  }
}

export async function fetchNotifications(supabase, userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function markAllNotificationsRead(supabase, userId) {
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
}

export async function fetchWizardAnswers(supabase, userId) {
  const { data } = await supabase.from("wizard_answers").select("*").eq("user_id", userId).maybeSingle();
  if (!data) return null;
  return {
    ageRange: [data.age_min, data.age_max],
    heightRange: [data.height_min, data.height_max],
    torahLevel: data.torah_level,
    regions: data.regions ?? [],
    education: data.education,
    smoking: data.smoking,
    traits: data.traits ?? [],
    completed: data.completed,
  };
}

export async function saveWizardAnswers(supabase, userId, answers, completed) {
  await supabase.from("wizard_answers").upsert({
    user_id: userId,
    age_min: answers.ageRange[0],
    age_max: answers.ageRange[1],
    height_min: answers.heightRange[0],
    height_max: answers.heightRange[1],
    torah_level: answers.torahLevel,
    regions: answers.regions,
    education: answers.education,
    smoking: answers.smoking,
    traits: answers.traits,
    completed,
    updated_at: new Date().toISOString(),
  });
}

export async function fetchPipelineStatus(supabase, candidateId) {
  const { data } = await supabase
    .from("pipeline_status")
    .select("*")
    .eq("candidate_id", candidateId)
    .maybeSingle();
  return data?.status ?? "בבירורים";
}

export async function setPipelineStatus(supabase, candidateId, status, userId) {
  await supabase
    .from("pipeline_status")
    .upsert({ candidate_id: candidateId, status, updated_by: userId, updated_at: new Date().toISOString() });
}
