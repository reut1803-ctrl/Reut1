// שכבת גישה למסד הנתונים (Supabase) - כל הקריאות שהאפליקציה צריכה.

export async function uploadCandidatePhoto(supabase, file) {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("candidate-photos").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("candidate-photos").getPublicUrl(path).data.publicUrl;
}

export async function insertCandidate(supabase, candidate) {
  const { data, error } = await supabase
    .from("candidates")
    .insert({
      gender: candidate.gender,
      name: candidate.name,
      age: candidate.age,
      height: candidate.height,
      region: candidate.region,
      religious_level: candidate.religiousLevel,
      study: candidate.study,
      smoking: candidate.smoking,
      traits: candidate.traits,
      about: candidate.about,
      image_url: candidate.image,
      is_new: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchProposals(supabase) {
  const { data, error } = await supabase
    .from("proposals")
    .select("*, male:male_candidate_id(id,name,image_url), female:female_candidate_id(id,name,image_url)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createProposal(supabase, { maleId, femaleId, rationale, userId }) {
  const { error } = await supabase.from("proposals").insert({
    male_candidate_id: maleId,
    female_candidate_id: femaleId,
    rationale,
    created_by: userId,
  });
  if (error) throw error;
}

export async function updateProposalStage(supabase, proposalId, stage) {
  const { error } = await supabase
    .from("proposals")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", proposalId);
  if (error) throw error;
}

export async function fetchTasks(supabase) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, candidate:candidate_id(id,name)")
    .order("done", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data;
}

export async function createTask(supabase, { title, dueDate, candidateId, assigneeId, createdBy, pushedByAdmin }) {
  const { error } = await supabase.from("tasks").insert({
    title,
    due_date: dueDate || null,
    candidate_id: candidateId || null,
    assignee_id: assigneeId || null,
    created_by: createdBy,
    pushed_by_admin: !!pushedByAdmin,
  });
  if (error) throw error;
}

export async function toggleTaskDone(supabase, taskId, done) {
  const { error } = await supabase.from("tasks").update({ done }).eq("id", taskId);
  if (error) throw error;
}

export async function fetchAllProfiles(supabase) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateUserRole(supabase, userId, role) {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw error;
}

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
