const { test, expect } = require('@playwright/test');

const worlds = [
  ['Ruimtewereld','Ruimtewereld','hf_20260912_143746_b59617fc-4c86-4eb9-a0fe-0e54b2100494.png'],
  ['Dierenwereld','Dierenwereld','hf_20260912_143746_ddbc8c7f-9749-4d5a-81b8-5704e5fd2591.png'],
  ['Aardewereld','Aardewereld','hf_20260912_143746_f40a81b0-e433-42f2-81bc-d351c726e487.png'],
  ['Geschiedeniswereld','Geschiedeniswereld','hf_20260912_143746_d9a31c5d-be9c-4fb4-b0d7-16ffa145658e.png'],
  ['Wetenschapwereld','Wetenschapwereld','hf_20260912_143746_89578ba1-01cc-45ce-9dd8-e83513e33228.png'],
  ['Mysteriewereld','Mysteriewereld','hf_20260912_143746_f83ec603-99e4-4d56-825d-ff422a9de04b.png']
];

async function boot(page){
  await page.route('**/*.mp4', route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('kwizillo-v4-state', JSON.stringify({
      coins:245,streak:7,level:5,xp:320,voice:'Stil',soundOn:false,musicOn:false,
      sfxVolume:.72,musicVolume:.24,musicTrack:'magical',timeLimitOn:true,timeLimit:45,
      group:5,answered:0,correct:0,quizzesPlayed:0,lastWorld:'ruimte',
      progress:{worlds:{},topics:{},correctQuestionIds:[]},selectedMascot:'milo'
    }));
  });
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Aardewereld'})).toBeVisible({timeout:7000});
}

async function openWorld(page, buttonName){
  await page.getByRole('button',{name:buttonName}).click();
  const world=page.locator('.native-world');
  await expect(world).toBeVisible({timeout:5000});
  await expect(page.locator('.world-topic')).toHaveCount(4);
  await expect(page.getByRole('button',{name:/Start gemengde quiz/})).toBeVisible();
  await expect(page.getByRole('button',{name:'Overslaan'})).toHaveCount(0);
}

test('all six world buttons open one premium native world layer without transition movie', async ({page})=>{
  await boot(page);
  for(const [buttonName,title,assetMarker] of worlds){
    await openWorld(page,buttonName);
    await expect(page.locator('.world-title-wrap h1')).toHaveText(title);
    await expect(page.locator('.native-world-bg')).toHaveCount(1);
    const src=await page.locator('.native-world-bg').getAttribute('src');
    expect(src).toContain(assetMarker);
    expect(src).not.toMatch(/assets\/world_(space|animals|earth|history|science|mystery)(?:_clean)?\.(?:png|svg)/);
    await page.getByRole('button',{name:'Terug naar home'}).click();
    await expect(page.getByRole('button',{name:'Aardewereld'})).toBeVisible();
  }
});

test('topic, hint, answer feedback and next-question flow are clickable', async ({page})=>{
  await boot(page);
  await openWorld(page,'Wetenschapwereld');
  await page.locator('.world-topic').first().click();
  await expect(page.locator('.quiz-v2')).toBeVisible();
  await expect(page.locator('.answer')).toHaveCount(4);
  await expect(page.locator('.quiz-art img')).toBeVisible();
  await page.getByRole('button',{name:/Hint/}).click();
  await expect(page.locator('.hint-float')).toBeVisible();
  await page.getByRole('button',{name:'Hint sluiten'}).click();
  await expect(page.locator('.hint-float')).toHaveCount(0);
  await page.locator('.answer').first().click();
  await expect(page.locator('.feedback-float')).toBeVisible();
  await page.locator('#feedbackNext').click();
  await expect(page.locator('.quiz-v2')).toBeVisible();
  await expect(page.locator('.quiz-progress')).toContainText('Vraag 2');
});

test('every main navigation destination is dynamic and interactive', async ({page})=>{
  await boot(page);
  await openWorld(page,'Aardewereld');
  await page.locator('.native-bottom-nav').getByRole('button',{name:/Prestaties/}).click();
  await expect(page.locator('.achievement-grid')).toBeVisible();
  await expect(page.locator('.achievement-card')).toHaveCount(6);
  await page.locator('.native-bottom-nav').getByRole('button',{name:/Collectie/}).click();
  await expect(page.locator('.collection-tabs')).toBeVisible();
  await page.getByRole('button',{name:/Kaarten/}).click();
  await expect(page.locator('.empty-state,.knowledge-grid')).toBeVisible();
  await page.getByRole('button',{name:/Mascottes/}).click();
  await expect(page.locator('.mascot-card')).toHaveCount(6);
  await page.locator('.mascot-card:not([disabled])').first().click();
  await page.locator('.native-bottom-nav').getByRole('button',{name:/Statistieken/}).click();
  await expect(page.locator('.stat-hero')).toBeVisible();
  await expect(page.locator('.world-stat-list article')).toHaveCount(6);
  await page.locator('.native-bottom-nav').getByRole('button',{name:/Meer/}).click();
  await expect(page.locator('.settings-list')).toBeVisible();
});

test('parent controls and audio panel can all be operated', async ({page})=>{
  await boot(page);
  await page.getByRole('button',{name:'Meer / Ouderzone'}).click();
  await expect(page.locator('.parent-screen')).toBeVisible();
  await expect(page.getByText('Groep 5')).toBeVisible();
  await page.locator('[data-group="plus"]').click();
  await expect(page.getByText('Groep 6')).toBeVisible();
  await page.locator('#timeToggle').click();
  await expect(page.locator('#timeRange')).toBeDisabled();
  await page.locator('#soundOpen').click();
  await expect(page.locator('.sound-settings-overlay')).toBeVisible();
  await expect(page.locator('[data-toggle="sfx"]')).toBeVisible();
  await expect(page.locator('[data-toggle="music"]')).toBeVisible();
  await expect(page.locator('[data-guide="Milo"]')).toBeVisible();
  await expect(page.locator('[data-guide="Luna"]')).toBeVisible();
  await expect(page.locator('[data-guide="Stil"]')).toBeVisible();
  await page.getByRole('button',{name:'Sluiten'}).click();
  await page.locator('#privacyOpen').click();
  await expect(page.locator('.simple-modal').getByRole('heading',{name:'Privacy & veiligheid'})).toBeVisible();
  await page.getByRole('button',{name:'Begrepen'}).click();
});

test('a complete 10-question quiz reaches dynamic result and result actions work', async ({page})=>{
  await boot(page);
  await openWorld(page,'Dierenwereld');
  await page.getByRole('button',{name:/Start gemengde quiz/}).click();
  for(let i=0;i<10;i++){
    await expect(page.locator('.quiz-v2')).toBeVisible();
    await expect(page.locator('.answer')).toHaveCount(4);
    await page.locator('.answer').first().click();
    await expect(page.locator('.feedback-float')).toBeVisible();
    await page.locator('#feedbackNext').click();
  }
  await expect(page.locator('.result-v2')).toBeVisible();
  await expect(page.getByRole('button',{name:'Nog een quiz'})).toBeVisible();
  await page.getByRole('button',{name:'Naar mijn collectie'}).click();
  await expect(page.locator('.collection-screen')).toBeVisible();
  await expect(page.locator('.collection-tabs')).toBeVisible();
});
