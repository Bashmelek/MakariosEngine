// JavaScript source code

/*
    ------Required to return in theGame------------
    Init
    OnFrame


    ------Optional to return in theGame------------
    customAttributes
    customUniforms

    ------Optional global variables to declare and set------------
    vsOverride
    fsOverride


*/


//var fsOverride;
//var vsOverride;
const BibleTrivia25 = (function () {
    const mat4 = glMatrix.mat4;
    const vec3 = glMatrix.vec3;
    const quat = glMatrix.quat;
    var objects = [];

    CommonShaders.InitCustomShader("0v0a");

    var wgl;
    var textureMatrix = mat4.create();

    var mainChar = null;
    var mainCharRot = null;
    baseGmod = null;
    var mousePos = { x: 0.0, y: 0.0 };


    var Init = function () {
        StageData.ticks = 0;
        SkyboxRenderer.useSkybox('skybox');
        ShadowShader.setup(null, [1.0, 0.6, 1.0]);
        OutlineRenderer.setup(null, [1.0, 0.6, 1.0]);
        ////Makarios.setStepsForCelShading(4.0);
        Makarios.SetUseAlphaInTextureBuffer(true);
        console.log(camDist);
        maxCamDist = 300.0;//global scope, plz fix
        maxZFar = 550.0;//this global too
        ShadowShader.setProjScaler(98.0);
        var initShadowProjScaler = ShadowShader.getProjScaler();

        //ortho(out, left, right, bottom, top, near, far)
        StageData.SetMainDirLight([.192, -1.752, 0.0], [0.0, 48.0, 0.0], [1.0, 1.0, 1.0]);
        StageData.defShadowProjMat = mat4.create();
        mat4.ortho(StageData.defShadowProjMat,
            -initShadowProjScaler, initShadowProjScaler, -initShadowProjScaler, initShadowProjScaler, 0.1, maxZFar + 1000);

        var shadowBoundMat = mat4.create();
        mat4.fromScaling(shadowBoundMat, [54.0, 54.0, 8.0]);
        StageData.shadowBoundBox = new Array(Primitives.shapes["cube"].positions.length);
        linTransformRange(StageData.shadowBoundBox, Primitives.shapes["cube"].positions, shadowBoundMat, 0, Primitives.shapes["cube"].positions.length, null);

        var thingsLoaded = 0;
        var maxThingsToLoad = 1;



        var canvas = document.getElementById("glCanvas");
        wgl = canvas.getContext("webgl");

        CommonShaders.InitCustomShaderData("0v0a");

        //var timmyloc = 'gmodels/firstCat12_emb.gltf';
        //Makarios.preloadGltfPrimitiveFromJsResource(timmyloc, "timmy");

        var katloc = 'gmodels/firstCat13_emb.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(katloc, "kat");

        var diamondloc = 'gmodels/diamond0.gltf';
        Makarios.preloadGltfPrimitiveFromJsResource(diamondloc, "diamond");

        //var ground01loc = 'gmodels/sampleGround01.gltf';
        //Makarios.preloadGltfPrimitiveFromJsResource(ground01loc, "groundsample");
        //var defmat1 = mat4.create();
        //mat4.fromScaling(defmat1, [0.1, 0.1, 0.1]);
        //var foxloc = 'SampleModels/Fox/glTF-Embedded/Fox.gltf';
        //Makarios.preloadGltfPrimitiveFromJsResource(foxloc, "testbox");

        //var milktruckloc = 'SampleModels/CesiumMilkTruck/glTF-Embedded/CesiumMilkTruck.gltf';
        //Makarios.preloadGltfPrimitiveFromJsResource(milktruckloc, "milktruck");

        //var caesarloc = 'SampleModels/CesiumMan/glTF-Embedded/CesiumMan.gltf';
        //Makarios.preloadGltfPrimitiveFromJsResource(caesarloc, "caesar");

        isLoading = false;

    };



    var GetMainChar = function () {
        return mainChar;
    };

    var questionDisplayBox = null;

    var cooldownTimer = 200;
    var inQuestion = false;
    var showingAnswer = false;
    var categories = [];
    var questions = [];
    var teams = [];
    var currentQuestion = null;

    var UpdateScoresDisplay = function () {
        for (var i = 0; i < teams.length; i++) {
            MakUI.writeObjToUI('teamscore_' + i, teams[i].score); 
        }
    }

    var onClickSubtract = function (subtractorInst) {
        if (cooldownTimer <= 0 && !inQuestion) {
            teams[subtractorInst.button.teamid].score -= 50;
            console.log(teams[subtractorInst.button.teamid].score)
            UpdateScoresDisplay();
        }
    };
    var onClickAdd = function (adderInst) {
        if (cooldownTimer <= 0 && !inQuestion) {
            teams[adderInst.button.teamid].score += 50;
            console.log(teams[adderInst.button.teamid].score)
            UpdateScoresDisplay();
        }
    };
    var onClickQuestion = function (questionInst) {
        if (cooldownTimer <= 0 && !inQuestion && questionInst.question.isActive) {
            questionInst.question.isActive = false;
            currentQuestion = questionInst.question;
            MakUI.writeObjToUI('question', questionInst.question.text); 
            questionInst.textureUrl = 'gmodels/gentlegraydark.jpg';
            questionInst.textureImage = null;
            inQuestion = true;
            cooldownTimer = 120;
            var displayboxMat = mat4.create();
            mat4.scale(displayboxMat, displayboxMat, [16, 16.0, 16.0]);
            mat4.translate(displayboxMat, displayboxMat, [0.0, 0.5, 0.0]);
            questionDisplayBox.matrix = displayboxMat;
        }
    };

    var onClickPopup = function (){
        if (cooldownTimer <= 0 && inQuestion) {

            if (!showingAnswer) {
                showingAnswer = true;
                cooldownTimer = 4;
                MakUI.writeObjToUI('answer', currentQuestion.answer);  
            } else {

                MakUI.writeObjToUI('question', "");
                MakUI.writeObjToUI('answer', ""); 
                inQuestion = false;
                showingAnswer = false;
                cooldownTimer = 120;
                currentQuestion = null;

                var displayboxMat = mat4.create();
                mat4.scale(displayboxMat, displayboxMat, [16, 16.0, 16.0]);
                mat4.translate(displayboxMat, displayboxMat, [-240.0, 0.5, 0.0]);
                questionDisplayBox.matrix = displayboxMat;
            }
        }
    }


    var PopulateQuestions = function () {

        categories.push({
            id: categories.length,
            name: 'Old Testament',
            numQuestions: 0,
            catImage: "BibleTriviaAssets/catOT.jpg"
        });
        categories.push({
            id: categories.length,
            name: 'New Testament',
            numQuestions: 0,
            catImage: "BibleTriviaAssets/catNT.jpg"
        });
        categories.push({
            id: categories.length,
            name: 'Lent',
            numQuestions: 0,
            catImage: "BibleTriviaAssets/catLent.jpg"
        });
        categories.push({
            id: categories.length,
            name: 'Mass & the Church',
            numQuestions: 0,
            catImage: "BibleTriviaAssets/catChurch.jpg"
        });
        categories.push({
            id: categories.length,
            name: 'Saints and Angels',//4
            numQuestions: 0,
            catImage: "BibleTriviaAssets/catSaints.jpg"
        });
        categories.push({
            id: categories.length,
            name: 'Sacraments',
            numQuestions: 0,
            catImage: "BibleTriviaAssets/catSacraments.jpg"
        });

        questions.push(
            {
                id: questions.length,
                text: 'David\'s son who became king.  He was famous for being wise.',
                answer: 'Solomon',
                points: 100,
                categoryid: 0
            });
        questions.push(
            {
                id: questions.length,
                text: 'These two sisters, along with their brother Lazarus, were friends\n of Jesus. When He came to visit them,\n one sister worked hard to serve him,\n the other listened to him attentively.',
                answer: 'Mary and Martha',
                points: 100,
                categoryid: 1
            });
        questions.push(
            {
                id: questions.length,
                text: 'This day begins the Easter Triduum, and is when Jesus celebrated\n the Last Supper with his disciples.',
                answer: 'Holy Thursday',
                points: 100,
                categoryid: 2
            });
        questions.push(
            {
                id: questions.length,
                text: 'He was pope, and is the Saint our chapter of TNTT is named after',
                answer: 'St. Pope John Paul II',
                points: 100,
                categoryid: 4
            });
        questions.push(
            {
                id: questions.length,
                text: 'He was the son of Abraham and Sarah',
                answer: 'Issac',
                points: 100,
                categoryid: 0
            });
        questions.push(
            {
                id: questions.length,
                text: 'A Judge of Israel, known for being strong and having long hair.',
                answer: 'Samson',
                points: 100,
                categoryid: 0
            });
        questions.push(
            {
                id: questions.length,
                text: 'Apostle called "The disciple whom Jesus loved".\n  One of the four evanglists, represented by an Eagle.\nHe was at the foot of the cross with Mary at the crucifixion',
                answer: 'St. John',
                points: 100,
                categoryid: 1
            });
        questions.push(
            {
                id: questions.length,
                text: 'The liturgical season of Lent\nis marked by this color.',
                answer: 'Purple',
                points: 100,
                categoryid: 2
            });
        questions.push(
            {
                id: questions.length,
                text: 'The Sunday before Easter.\nRemembering when Jesus entered Jerusalem.\nThe crowds sang Hosanna and waved branches.',
                answer: 'Palm Sunday',
                points: 100,
                categoryid: 2
            });
        questions.push(
            {
                id: questions.length,
                text: 'Easter always falls on this day of the week',
                answer: 'Sunday',
                points: 100,
                categoryid: 2
            });
        questions.push(
            {
                id: questions.length,
                text: 'The garden where Jesus prayed on the night he was betrayed',
                answer: 'Gethsemane',
                points: 200,
                categoryid: 2
            });
        questions.push(
            {
                id: questions.length,
                text: 'He was a follower of Jesus, who gave Jesus\n his tomb and helped prepare his burial',
                answer: 'Joseph of Arimathea',
                points: 200,
                categoryid: 2
            });
        questions.push(
            {
                id: questions.length,
                text: 'The brother of Moses and Miriam\nHe was the first High Priest of Israel',
                answer: 'Aaron',
                points: 100,
                categoryid: 0
            });
        questions.push(
            {
                id: questions.length,
                text: 'King David played this instrument',
                answer: 'Harp',
                points: 100,
                categoryid: 0
            });
        questions.push(
            {
                id: questions.length,
                text: 'This book of the Bible contains the story of Moses and\nthe Israelites exit from Egypt',
                answer: 'Exodus',
                points: 100,
                categoryid: 0
            });
        questions.push(
            {
                id: questions.length,
                text: 'This is the last book of the Torah\nits name means Second Law',
                answer: 'Deuteronomy',
                points: 200,
                categoryid: 0
            });
        questions.push(
            {
                id: questions.length,
                text: 'The Temple had a limited access section inside\ncalled the Holy Place. Inside the Holy Place was an even holier place\nthat was only accessed by the High Priest, once a year\nWhat is this place called? It once held the ark of the covenant.',
                answer: 'The Holy of Holies',
                points: 200,
                categoryid: 0
            });
        questions.push(
            {
                id: questions.length,
                text: 'The city where Jesus was born.\nIts name literally means House of Bread',
                answer: 'Bethlehem',
                points: 100,
                categoryid: 1
            });
        questions.push(
            {
                id: questions.length,
                text: 'He was a short tax-collector climbed a\nsycamore tree so he could see Jesus',
                answer: 'Zacchaeus',
                points: 100,
                categoryid: 1
            });
        questions.push(
            {
                id: questions.length,
                text: 'This book of the Bible is also known as\nthe Apocalypse of St. John.',
                answer: 'Revelations',
                points: 100,
                categoryid: 1
            });
        questions.push(
            {
                id: questions.length,
                text: 'At the Sermon on the Mount, Jesus taught these statements:\nBlessed are the poor in spirit, for theirs is the Kingdom of Heaven\nBlessed are they who mourn, for they will be comforted\nWhat do we call these teachings?',
                answer: 'The Beatitudes',
                points: 100,
                categoryid: 1
            });
        questions.push(
            {
                id: questions.length,
                text: 'Not the Pharisees\nbut another Jewish group during the time of Jesus\nThey were named after the High Priest Zadok\nThey did not believe in the resurrection of the body',
                answer: 'Sadducees',
                points: 200,
                categoryid: 1
            });
        questions.push(
            {
                id: questions.length,
                text: 'These four creatures represent the four evangelists:\nMatthew, Mark, Luke, and John.\nThey also feature of the four living beings in Revelations',
                answer: 'The man, lion, bull, and eagle',
                points: 200,
                categoryid: 1
            });
        questions.push(
            {
                id: questions.length,
                text: 'Our current pope adopted his pope-name from this Saint\nHe was from Assisi, and started a religious order\nHe is famous for his love of animals',
                answer: 'St. Francis of Assisi',
                points: 100,
                categoryid: 4
            });
        questions.push(
            {
                id: questions.length,
                text: 'This legendary saint was a soldier\nand is said to have slain a dragon',
                answer: 'St. George',
                points: 100,
                categoryid: 4
            });
        questions.push(
            {
                id: questions.length,
                text: 'This saint was known for writing books on theology\nHe is the saint our diocese is named after',
                answer: 'St. Augustine of Hippo',
                points: 100,
                categoryid: 4
            });
        questions.push(
            {
                id: questions.length,
                text: 'He baptized Jesus\nHe was the son of Mary\'s cousin, Elizabeth, and was six months\nolder than Jesus',
                answer: 'John the Baptist',
                points: 100,
                categoryid: 4
            });
        questions.push(
            {
                id: questions.length,
                text: 'This choir of angels is often regarded as the highest\nThey were seen in Isaiah\'s vision\nwith six wings each',
                answer: 'Seraphim',
                points: 200,
                categoryid: 4
            });
        questions.push(
            {
                id: questions.length,
                text: 'He was the first Christian martyr.\nFor that, he is titled Protomartyr',
                answer: 'St. Stephen',
                points: 200,
                categoryid: 4
            });
        questions.push(
            {
                id: questions.length,
                text: 'This archangel features in the book of Tobit\nHe helps lead Tobiah to Sarah\nHis name means God Heals',
                answer: 'Rafael',
                points: 200,
                categoryid: 4
            });
        questions.push(
            {
                id: questions.length,
                text: 'On second to last Sunday of Lent\nLaetare Sunday, meaning Rejoice,\nThe priest wears this color vestments',
                answer: 'Rose',
                points: 200,
                categoryid: 2
            });
        questions.push(
            {
                id: questions.length,
                text: 'These special church leaders wear red\nThey vote for the pope\nand are able to become pope',
                answer: 'Cardinal',
                points: 100,
                categoryid: 3
            });
        questions.push(
            {
                id: questions.length,
                text: 'Bishops wear this kind of hat',
                answer: 'Miter',
                points: 100,
                categoryid: 3
            });
        questions.push(
            {
                id: questions.length,
                text: 'What we call special churches where the\nbishops chair resides. Every diocese has (at least)\none of these churches',
                answer: 'Cathedral',
                points: 100,
                categoryid: 3
            });
        questions.push(
            {
                id: questions.length,
                text: 'This Roman emperor made Christianity legal with the Edit of Milan in 314\nHe called together the council of Nicaea]nand converted to Christianity',
                answer: 'Constantine',
                points: 100,
                categoryid: 3
            });
        questions.push(
            {
                id: questions.length,
                text: 'These are songs we sing after the first reading\nMany were written by King David\nand there is a book in the Bible named this',
                answer: 'Psalms',
                points: 100,
                categoryid: 3
            });
        questions.push(
            {
                id: questions.length,
                text: 'This is the army of Vatican City\nand personal bodyguard of the pope',
                answer: 'Swiss Guard',
                points: 200,
                categoryid: 3
            });
        questions.push(
            {
                id: questions.length,
                text: 'Mass is celebrated every day of the year, except one.\nWhat day is it? It is also a day of fasting',
                answer: 'Good Friday',
                points: 200,
                categoryid: 3
            });
        questions.push(
            {
                id: questions.length,
                text: 'At confirmation, the bishop anoints the candidate\nwith this',
                answer: 'Chrism; or Holy Oil',
                points: 100,
                categoryid: 5
            });
        questions.push(
            {
                id: questions.length,
                text: 'When preparing the Eucharist, the priest\nadds some of this to the wine',
                answer: 'Water',
                points: 100,
                categoryid: 5
            });
        questions.push(
            {
                id: questions.length,
                text: 'This sacrament is commonly known as Marriage',
                answer: 'Matrimony',
                points: 100,
                categoryid: 5
            });
        questions.push(
            {
                id: questions.length,
                text: 'Who instituted the sacraments?',
                answer: 'Jesus',
                points: 100,
                categoryid: 5
            });
        questions.push(
            {
                id: questions.length,
                text: 'This is the sin we inherit from our first parents, Adam and Eve.\nIt is washed away through Baptism',
                answer: 'Original Sin',
                points: 200,
                categoryid: 5
            });
        questions.push(
            {
                id: questions.length,
                text: 'This is the name of the cup that holds the Body Of Christ',
                answer: 'Ciborium',
                points: 200,
                categoryid: 5
            });

        for (var q = 0; q < questions.length; q++) {
            questions[q].isActive = true;
        }

    };

    var InitNamePlates = function () {
        teams.push({
            id: teams.length,
            name: '',
            score: 0,
            teamImage: "BibleTriviaAssets/teamChamael.jpg"
        });
        teams.push({
            id: teams.length,
            name: '',
            score: 0,
            teamImage: "BibleTriviaAssets/teamCherubim.jpg"
        });
        teams.push({
            id: teams.length,
            name: '',
            score: 0,
            teamImage: "BibleTriviaAssets/teamMichael.jpg"
        });

        teams.push({
            id: teams.length,
            name: '',
            score: 0,
            teamImage: "BibleTriviaAssets/teamRafael.jpg"
        });
        teams.push({
            id: teams.length,
            name: '',
            score: 0,
            teamImage: "BibleTriviaAssets/teamSeraphim.jpg"
        });
        teams.push({
            id: teams.length,
            name: '',
            score: 0,
            teamImage: "BibleTriviaAssets/teamUriel.jpg"
        }); 

        for (var i = 0; i < teams.length; i++) {
            var nameplate = Makarios.instantiate(Primitives.shapes["plane"], teams[i].teamImage, null, {});
            mat4.translate(nameplate.matrix, nameplate.matrix, [8.0 * i + -18.0, 0.0, 9.0]);

            var addScore = Makarios.instantiate(Primitives.shapes["plane"], 'BibleTriviaAssets/scoreplus.jpg', null, {});
            mat4.translate(addScore.matrix, addScore.matrix, [8.0 * i + -16.0, 0.0, 9.0]); 
            addScore.button = { teamid: i }
            addScore.OnObjectClick = onClickAdd;
            var subtractScore = Makarios.instantiate(Primitives.shapes["plane"], 'BibleTriviaAssets/scoreminus.jpg', null, {});
            mat4.translate(subtractScore.matrix, subtractScore.matrix, [8.0 * i + -20.00, 0.0, 9.0]);
            subtractScore.button = { teamid: i }
            subtractScore.OnObjectClick = onClickSubtract;


            var scoreZone = {
                id: 1,
                rect: { nx: 0.12 + i * 0.166, ny: 0.78, nwidth: 0.3, nheight: 0.2 },
                textAlign: 'left'
            };

            var scoreplatedata = {
                zone: scoreZone,
                nx: 2,
                ny: 2,

            };
            MakUI.writeObjToUI('teamscore_' + i, teams[i].score, scoreplatedata); 
        }
    };

    var InitTriviaBoard = function () {

        for (var c = 0; c < categories.length; c++) {
            var catHeader = Makarios.instantiate(Primitives.shapes["plane"], categories[c].catImage, null, {});
            mat4.translate(catHeader.matrix, catHeader.matrix, [8.0 * c + -20.00, 0.0, -12.8]);
            mat4.scale(catHeader.matrix, catHeader.matrix, [2.0, 2.0, 2.0]);
        }
        for (var q = 0; q < questions.length; q++) {

            var catid = questions[q].categoryid;
            var catQcount = categories[questions[q].categoryid].numQuestions;

            var questionItem = Makarios.instantiate(Primitives.shapes["plane"], questions[q].points == 200 ? 'BibleTriviaAssets/score200.jpg' : 'BibleTriviaAssets/score100.jpg', null, {});
            mat4.translate(questionItem.matrix, questionItem.matrix, [8.0 * catid + -20.00, 0.0, -9.4 + (catQcount * 2.1)]);
            questionItem.question = questions[q];
            questionItem.OnObjectClick = onClickQuestion;

            categories[questions[q].categoryid].numQuestions++;
        }
    };


    var isLoading = true;
    var ProcInLoading = function () {

        if (isLoading || Makarios.isPreloading()) { return };



        yaw = Math.PI / 1.0;//.6;
        pitch = Math.PI / 12.0;//0.65




        var obChar = Makarios.instantiate(Primitives.shapes["kat"], Primitives.shapes["kat"].textureUrl, null, {});
        mat4.translate(obChar.matrix, obChar.matrix, [50.0 + -18.0, 0.0, 9.0]);

        InitNamePlates();
        PopulateQuestions();

        InitTriviaBoard();


        questionDisplayBox = Makarios.instantiate(Primitives.shapes["plane"], 'gmodels/plainsapphire.jpg', null, {});
        mat4.scale(questionDisplayBox.matrix, questionDisplayBox.matrix, [16, 16.0, 16.0]);
        mat4.translate(questionDisplayBox.matrix, questionDisplayBox.matrix, [-240.00, 0.5, 0.0]);
        questionDisplayBox.OnObjectClick = onClickPopup;

        var questionZone = {
            id: 1,
            rect: { nx: 0.12, ny: 0.1, nwidth: 0.8, nheight: 0.4 },
            textAlign: 'left'
        };

        var qdata = {
            zone: questionZone,
            nx: 2,
            ny: 2,
            fontsize: 16
        };
        MakUI.writeObjToUI('question', "", qdata);

        var answerZone = {
            id: 1,
            rect: { nx: 0.12, ny: 0.5, nwidth: 0.8, nheight: 0.15 },
            textAlign: 'left'
        };

        var ansdata = {
            zone: answerZone,
            nx: 2,
            ny: 2,
            fontsize: 16
        };
        MakUI.writeObjToUI('answer', "", ansdata); 

        mainChar = obChar;

        document.querySelector('#uiCanvas').onmousemove = function (e) {
            e = e || window.event;
            mousePos = { x: e.clientX, y: e.clientY };
        }
        console.log(StageData.objects);

        gmod = mat4.create();
        mat4.translate(gmod,     // destination matrix
            gmod,     // matrix to translate
            [-0.0, 0.0, -camDist * 2.0]);
        mat4.rotate(gmod, gmod, 0.0, [gmod[1], gmod[5], gmod[9]]);//yaw
        mat4.rotate(gmod, gmod, Math.PI / 2.0, [gmod[0], gmod[4], gmod[8]]);//pitch


        EnableClickActions();

        WanderProc = MainProc;
    };

    var MainProc = function () {

        ChaosControlv0.OnFrame();

        //StageData.SetMainDirLight([0.5, 0.001 * StageData.ticks, 0.0], [0.0, 0.0, 18.0], [1.0, 1.0, 1.0]);
        StageData.SetMainDirLight([0.000 * StageData.ticks + 0.5, 0.0000 * StageData.ticks, 0.0], [0.0, 0.0, 144.0], [1.0, 1.0, 1.0]);//176

        var lpoint = [0.0, 0.0, 0.0];
        var lightLocMat = mat4.create();
        mat4.invert(lightLocMat, StageData.StageLights[0].lightmat);
        linTransformRange(lpoint, lpoint, lightLocMat, 0, 3, null);
        //lpoint = [-lpoint[0], -lpoint[1], -lpoint[2]];//[0.85, 0.8, 0.75];//[-lpoint[0], -lpoint[1], -lpoint[2]]
        //lpoint = [0.9, 0.9, 0.9];
        var lpointvec = vec3.create();
        lpointvec[0] = lpoint[0]; lpointvec[1] = lpoint[1]; lpointvec[2] = lpoint[2];
        vec3.normalize(lpointvec, lpointvec);
        wgl.uniform3fv(
            globalMainProgramInfo.uniformLocations.lightDirection,
            lpoint);////[0.000 * StageData.ticks + 0.5, 0.002 * StageData.ticks, 0.0]);
        //console.log(gmod);

        if (gmod && !baseGmod) {
            baseGmod = mat4.create();
            baseGmod = mat4.clone(gmod);
        }
        var qcharRot = quat.create();
        mat4.getRotation(qcharRot, mainChar.matrix);

        //var charRotMat = mat4.create();
        //fromQuat(charRotMat, qcharRot);
        //console.log((QuatToEulers(qcharRot)[1] + 360.0) % 360.0);



        /////////////////////////----------START MAIN GAME LOGIC


        cooldownTimer--;



        /////////////////////////////////////---------END MAIN GAME LOGIC
        var basematrix = mat4.create();
        mat4.multiply(basematrix, gproj, gmod);

        var hitstuff = {};
        hitstuff.tris = [];
        hitstuff.objects = [];
        var objcount = StageData.objects.length;

        //for (var objindex = 0; objindex < objcount; objindex++) {
        //    if (!StageData.objects[objindex]) { continue; }
        //    StageData.objects[objindex].outlineColor = [1.0, 0.6, 1.0];
        //    var objmatrix = mat4.create();
        //    mat4.multiply(objmatrix, basematrix, StageData.objects[objindex].matrix);

        //    //recursiveCheckAllObjectsIfScreenPointHits(StageData.objects[objindex], null, objmatrix, [], hitstuff, { x: mousePos.x, y: mousePos.y }, [], objindex);
        //}
        //for (var hitdex = 0; hitdex < hitstuff.objects.length; hitdex++) {
        //    //console.log(hitstuff.objects[hitdex]);
        //    StageData.objects[hitstuff.objects[hitdex]].outlineColor = [1.0, 1.0, 0.1];
        //}

    };

    var WanderProc = ProcInLoading;

    var OnFrame = function () {
        //FrameLogic.onFrame();
        WanderProc();
    };

    return {
        'Init': Init, 'OnFrame': OnFrame,
        'customAttributes': customAttributes,
        'customUniforms': customUniforms,
        'GetMainChar': GetMainChar
    };
})();