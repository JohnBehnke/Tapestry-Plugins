// com.astrobin.iotd

var lastDate = null;
const host = "https://astrobin.com";
const apiPath = "api/v1";
const minuteThreshold = 1440;

function load() {
  const authParams = `api_key=${apiKey}&api_secret=${apiSecret}`;
  const date = new Date();

  if (Math.floor((date - lastDate) / 1000 / 60) > minuteThreshold) {
    let iotdUrl = `${host}/${apiPath}/imageoftheday?limit=1&${authParams}&format=json`;

    sendRequest(iotdUrl)
      .then((iotdRawData) => {
        const parsedIOTDData = JSON.parse(iotdRawData);
        const iotdInfo = parsedIOTDData["objects"][0];
        const imageAPIPath = iotdInfo["image"];
        const iotdDate = new Date(iotdInfo["date"]);
        const imageUrl = `${host}${imageAPIPath}?${authParams}&format=json`;

        sendRequest(imageUrl)
          .then((imageRawData) => {
            const parsedImageData = JSON.parse(imageRawData);
            const imageUrl = parsedImageData["url_hd"];
            const imageWidth = parsedImageData["w"];
            const imageHeight = parsedImageData["h"];
            const iotdUri = `${host}/${parsedImageData["hash"]}`;
            const user = parsedImageData["user"];
            const userUrl = `${host}/${apiPath}/userprofile?username=${user}&${authParams}&format=json`;
            

            sendRequest(userUrl)
              .then((rawUserData) => {
                const parsedUserData = JSON.parse(rawUserData);
                const userInfo = parsedUserData["objects"][0];
                const creatorUrl = `${host}/users/${userInfo["username"]}/`;
                const creatorName = userInfo["real_name"];

                const creator = Identity.createWithName(creatorName);
                creator.uri = creatorUrl;
                creator.avatar = userInfo["avatar"];

                const attachment = MediaAttachment.createWithUrl(imageUrl);
                attachment.aspectSize = { width: imageWidth, height: imageHeight };
                attachment.focalPoint = { x: 0, y: 0 };

                const likesText = `Likes: ${parsedImageData["likes"]}`;
                const likesAnnotation = Annotation.createWithText(likesText);
                const viewsText = `Views: ${parsedImageData["views"]}`;
                const viewsAnnotation = Annotation.createWithText(viewsText);

                var resultItem = Item.createWithUriDate(iotdUri, iotdDate);
                resultItem.author = creator;
                resultItem.title = parsedImageData["title"];
                resultItem.body = `<p>${parsedImageData["description"]}</p>`;
                resultItem.attachments = [attachment];
                resultItem.annotations = [likesAnnotation, viewsAnnotation];

                processResults([resultItem]);
                lastDate = iotdDate;
              })
              .catch((requestError) => {
                processError(requestError);
              });
          })
          .catch((requestError) => {
            processError(requestError);
          });
      })
      .catch((requestError) => {
        processError(requestError);
      });
  }
}